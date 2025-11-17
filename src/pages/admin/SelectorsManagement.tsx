import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAllEntities, useCreateEntity, useUpdateEntity, useDeleteEntity } from "@/hooks/useSystemEntities";
import { useAllCities, useCreateCity, useUpdateCity, useDeleteCity } from "@/hooks/useSystemCities";
import { useUtmPlatforms, useCreatePlatform, useUpdatePlatform, useDeletePlatform } from "@/hooks/useUtmPlatforms";
import { useUtmMediums, useCreateMedium, useUpdateMedium, useDeleteMedium } from "@/hooks/useUtmMediums";
import { useUtmCampaigns, useCreateUtmCampaign, useUpdateUtmCampaign, useDeleteUtmCampaign, useUpdateCampaignOrder } from "@/hooks/useUtmCampaigns";
import { CountryCodeSelect } from "@/components/admin/CountryCodeSelect";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  checkEntityDependencies, 
  checkCityDependencies, 
  checkPlatformDependencies, 
  checkMediumDependencies,
  formatDependencyMessage 
} from "@/lib/selectorDependencyCheck";

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div {...attributes} {...listeners} className="cursor-move">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      {children}
    </TableRow>
  );
}

export default function SelectorsManagement() {
  // Force session refresh on page load
  useEffect(() => {
    const refreshSession = async () => {
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.error('Session refresh failed:', error);
          toast.error('Session expired. Please log out and log back in.');
        }
      } catch (err) {
        console.error('Session refresh error:', err);
      }
    };

    refreshSession();
  }, []);

  const checkAdminSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      toast.error('Session expired', {
        description: 'Please log out and log back in',
        duration: 7000
      });
      return false;
    }
    
    return true;
  };

  const [activeTab, setActiveTab] = useState("entities");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Entity state
  const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [entityForm, setEntityForm] = useState({ name: "", code: "", emoji: "", display_order: 0, website_param: "", customWebsiteParam: "" });
  const [isDeleteEntityDialogOpen, setIsDeleteEntityDialogOpen] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<{ id: string; code: string } | null>(null);
  
  // City state
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);
  const [cityForm, setCityForm] = useState({ name: "", country: "", display_order: 0 });
  const [isDeleteCityDialogOpen, setIsDeleteCityDialogOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Platform state
  const [isPlatformDialogOpen, setIsPlatformDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<any>(null);
  const [platformForm, setPlatformForm] = useState({ name: "", utm_medium: "" });
  const [isDeletePlatformDialogOpen, setIsDeletePlatformDialogOpen] = useState(false);
  const [platformToDelete, setPlatformToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Medium state
  const [isMediumDialogOpen, setIsMediumDialogOpen] = useState(false);
  const [editingMedium, setEditingMedium] = useState<any>(null);
  const [mediumForm, setMediumForm] = useState({ name: "", display_order: 0 });
  const [isDeleteMediumDialogOpen, setIsDeleteMediumDialogOpen] = useState(false);
  const [mediumToDelete, setMediumToDelete] = useState<{ id: string; name: string } | null>(null);

  // Campaign state
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [campaignForm, setCampaignForm] = useState({ name: "", landing_page: "", campaign_type: "", description: "", display_order: 0 });
  const [isDeleteCampaignDialogOpen, setIsDeleteCampaignDialogOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{ id: string; name: string } | null>(null);

  // Hooks
  const { data: entities, isLoading: entitiesLoading } = useAllEntities();
  const { data: cities, isLoading: citiesLoading } = useAllCities();
  const { data: platforms, isLoading: platformsLoading } = useUtmPlatforms();
  const { data: mediums, isLoading: mediumsLoading } = useUtmMediums();
  const { data: campaigns, isLoading: campaignsLoading } = useUtmCampaigns();

  const createEntity = useCreateEntity();
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();

  const createCity = useCreateCity();
  const updateCity = useUpdateCity();
  const deleteCity = useDeleteCity();

  const createPlatform = useCreatePlatform();
  const updatePlatform = useUpdatePlatform();
  const deletePlatform = useDeletePlatform();

  const createMedium = useCreateMedium();
  const updateMedium = useUpdateMedium();
  const deleteMedium = useDeleteMedium();

  const createCampaign = useCreateUtmCampaign();
  const updateCampaign = useUpdateUtmCampaign();
  const deleteCampaign = useDeleteUtmCampaign();
  const updateCampaignOrder = useUpdateCampaignOrder();

  // Drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Entity handlers
  const handleEntitySubmit = async () => {
    const websiteParam = entityForm.website_param === 'custom' 
      ? entityForm.customWebsiteParam 
      : entityForm.website_param;
    
    // Destructure to exclude customWebsiteParam (UI-only field)
    const { customWebsiteParam, ...entityData } = entityForm;
      
    if (editingEntity) {
      // Only send database columns
      await updateEntity.mutateAsync({ 
        id: editingEntity.id, 
        ...entityData, 
        website_param: websiteParam 
      });
    } else {
      await createEntity.mutateAsync({ 
        ...entityData, 
        website_param: websiteParam, 
        is_active: true 
      });
    }
    setIsEntityDialogOpen(false);
    setEditingEntity(null);
    setEntityForm({ name: "", code: "", emoji: "", display_order: 0, website_param: "", customWebsiteParam: "" });
  };

  const handleDeleteEntity = async (id: string, code: string) => {
    // Check session first
    if (!await checkAdminSession()) return;

    const { canDelete, dependencies } = await checkEntityDependencies(code);
    
    if (!canDelete) {
      toast.error('Cannot delete entity', {
        description: formatDependencyMessage(dependencies),
        duration: 7000,
      });
      return;
    }
    
    setEntityToDelete({ id, code });
    setIsDeleteEntityDialogOpen(true);
  };

  const confirmDeleteEntity = async () => {
    if (entityToDelete) {
      await deleteEntity.mutateAsync(entityToDelete.id);
      setIsDeleteEntityDialogOpen(false);
      setEntityToDelete(null);
    }
  };

  const handleEntityDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id && entities) {
      const oldIndex = entities.findIndex((e) => e.id === active.id);
      const newIndex = entities.findIndex((e) => e.id === over.id);
      const reordered = arrayMove(entities, oldIndex, newIndex);
      
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].display_order !== i) {
          await updateEntity.mutateAsync({ id: reordered[i].id, display_order: i });
        }
      }
    }
  };

  // City handlers
  const handleCitySubmit = async () => {
    if (editingCity) {
      await updateCity.mutateAsync({ id: editingCity.id, ...cityForm });
    } else {
      await createCity.mutateAsync(cityForm);
    }
    setIsCityDialogOpen(false);
    setEditingCity(null);
    setCityForm({ name: "", country: "", display_order: 0 });
  };

  const handleDeleteCity = async (id: string, name: string) => {
    // Check session first
    if (!await checkAdminSession()) return;

    const { canDelete, dependencies } = await checkCityDependencies(name);
    
    if (!canDelete) {
      toast.error('Cannot delete city', {
        description: formatDependencyMessage(dependencies),
        duration: 7000,
      });
      return;
    }
    
    setCityToDelete({ id, name });
    setIsDeleteCityDialogOpen(true);
  };

  const confirmDeleteCity = async () => {
    if (cityToDelete) {
      await deleteCity.mutateAsync(cityToDelete.id);
      setIsDeleteCityDialogOpen(false);
      setCityToDelete(null);
    }
  };

  const handleCityDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id && cities) {
      const oldIndex = cities.findIndex((c) => c.id === active.id);
      const newIndex = cities.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(cities, oldIndex, newIndex);
      
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].display_order !== i) {
          await updateCity.mutateAsync({ id: reordered[i].id, display_order: i });
        }
      }
    }
  };

  // Platform handlers
  const handlePlatformSubmit = async () => {
    if (editingPlatform) {
      await updatePlatform.mutateAsync({ id: editingPlatform.id, ...platformForm });
    } else {
      await createPlatform.mutateAsync(platformForm);
    }
    setIsPlatformDialogOpen(false);
    setEditingPlatform(null);
    setPlatformForm({ name: "", utm_medium: "" });
  };

  const handleDeletePlatform = async (id: string, name: string) => {
    // Check session first
    if (!await checkAdminSession()) return;

    const { canDelete, dependencies } = await checkPlatformDependencies(name);
    
    if (!canDelete) {
      toast.error('Cannot delete platform', {
        description: formatDependencyMessage(dependencies),
        duration: 7000,
      });
      return;
    }
    
    setPlatformToDelete({ id, name });
    setIsDeletePlatformDialogOpen(true);
  };

  const confirmDeletePlatform = async () => {
    if (platformToDelete) {
      await deletePlatform.mutateAsync(platformToDelete.id);
      setIsDeletePlatformDialogOpen(false);
      setPlatformToDelete(null);
    }
  };

  // Medium handlers
  const handleMediumSubmit = async () => {
    if (editingMedium) {
      await updateMedium.mutateAsync({ id: editingMedium.id, ...mediumForm });
    } else {
      await createMedium.mutateAsync(mediumForm);
    }
    setIsMediumDialogOpen(false);
    setEditingMedium(null);
    setMediumForm({ name: "", display_order: 0 });
  };

  const handleDeleteMedium = async (id: string, name: string) => {
    // Check session first
    if (!await checkAdminSession()) return;

    const { canDelete, dependencies } = await checkMediumDependencies(name);
    
    if (!canDelete) {
      toast.error('Cannot delete UTM medium', {
        description: formatDependencyMessage(dependencies),
        duration: 7000,
      });
      return;
    }
    
    setMediumToDelete({ id, name });
    setIsDeleteMediumDialogOpen(true);
  };

  const confirmDeleteMedium = async () => {
    if (mediumToDelete) {
      await deleteMedium.mutateAsync(mediumToDelete.id);
      setIsDeleteMediumDialogOpen(false);
      setMediumToDelete(null);
    }
  };

  // Campaign handlers
  const handleCampaignSubmit = async () => {
    if (editingCampaign) {
      await updateCampaign.mutateAsync({ 
        id: editingCampaign.id, 
        name: campaignForm.name,
        landing_page: campaignForm.landing_page || null,
      });
    } else {
      await createCampaign.mutateAsync({ 
        name: campaignForm.name, 
        landingPage: campaignForm.landing_page 
      });
    }
    setIsCampaignDialogOpen(false);
    setEditingCampaign(null);
    setCampaignForm({ name: "", landing_page: "", campaign_type: "", description: "", display_order: 0 });
  };

  const confirmDeleteCampaign = async () => {
    if (campaignToDelete) {
      await deleteCampaign.mutateAsync(campaignToDelete.id);
      setIsDeleteCampaignDialogOpen(false);
      setCampaignToDelete(null);
    }
  };

  const handleMediumDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id && mediums) {
      const oldIndex = mediums.findIndex((m) => m.id === active.id);
      const newIndex = mediums.findIndex((m) => m.id === over.id);
      const reordered = arrayMove(mediums, oldIndex, newIndex);
      
      for (let i = 0; i < reordered.length; i++) {
        if (reordered[i].display_order !== i) {
          await updateMedium.mutateAsync({ id: reordered[i].id, display_order: i });
        }
      }
    }
  };

  // Filter functions
  const filteredEntities = entities?.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.code.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredCities = cities?.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredPlatforms = platforms?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const filteredMediums = mediums?.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-title font-bold">Selectors Management</h1>
          <p className="text-body text-muted-foreground mt-1">
            Manage entities, cities, platforms, and UTM mediums
          </p>
        </div>
        <AdminStatusBadge />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
        </TabsList>

        {/* Entities Tab */}
        <TabsContent value="entities" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { 
              setEditingEntity(null); 
              setEntityForm({ name: "", code: "", emoji: "", display_order: entities?.length || 0, website_param: "", customWebsiteParam: "" }); 
              setIsEntityDialogOpen(true); 
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entity
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEntityDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Emoji</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Website Param</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entitiesLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                    ) : filteredEntities.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No entities found</TableCell></TableRow>
                    ) : (
                      <SortableContext items={filteredEntities.map(e => e.id)} strategy={verticalListSortingStrategy}>
                        {filteredEntities.map((entity) => (
                          <SortableRow key={entity.id} id={entity.id}>
                            <TableCell>{entity.display_order}</TableCell>
                            <TableCell className="text-2xl">{entity.emoji}</TableCell>
                            <TableCell className="font-medium">{entity.name}</TableCell>
                            <TableCell><Badge variant="outline">{entity.code}</Badge></TableCell>
                            <TableCell><Badge>{entity.website_param || "-"}</Badge></TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingEntity(entity);
                                    const isCustom = !['ae', 'sa', 'eg', 'kw', 'bh', 'om', 'qa'].includes(entity.website_param || '');
                                    setEntityForm({
                                      name: entity.name,
                                      code: entity.code,
                                      emoji: entity.emoji || "",
                                      display_order: entity.display_order,
                                      website_param: isCustom ? 'custom' : (entity.website_param || ""),
                                      customWebsiteParam: isCustom ? (entity.website_param || "") : ""
                                    });
                                    setIsEntityDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteEntity(entity.id, entity.code)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </SortableRow>
                        ))}
                      </SortableContext>
                    )}
                  </TableBody>
                </Table>
              </DndContext>
            </div>
          </div>
        </TabsContent>

        {/* Cities Tab */}
        <TabsContent value="cities" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { 
              setEditingCity(null); 
              setCityForm({ name: "", country: "", display_order: cities?.length || 0 }); 
              setIsCityDialogOpen(true); 
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add City
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCityDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {citiesLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                    ) : filteredCities.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No cities found</TableCell></TableRow>
                    ) : (
                      <SortableContext items={filteredCities.map(c => c.id)} strategy={verticalListSortingStrategy}>
                        {filteredCities.map((city) => (
                          <SortableRow key={city.id} id={city.id}>
                            <TableCell>{city.display_order}</TableCell>
                            <TableCell className="font-medium">{city.name}</TableCell>
                            <TableCell>{city.country}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCity(city);
                                    setCityForm({
                                      name: city.name,
                                      country: city.country,
                                      display_order: city.display_order
                                    });
                                    setIsCityDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteCity(city.id, city.name)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </SortableRow>
                        ))}
                      </SortableContext>
                    )}
                  </TableBody>
                </Table>
              </DndContext>
            </div>
          </div>
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search platforms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { 
              setEditingPlatform(null); 
              setPlatformForm({ name: "", utm_medium: "" }); 
              setIsPlatformDialogOpen(true); 
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Platform
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>UTM Medium</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformsLoading ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow>
                  ) : filteredPlatforms.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No platforms found</TableCell></TableRow>
                  ) : (
                    filteredPlatforms.map((platform) => (
                      <TableRow key={platform.id}>
                        <TableCell className="font-medium">{platform.name}</TableCell>
                        <TableCell><Badge>{platform.utm_medium || "-"}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPlatform(platform);
                                setPlatformForm({
                                  name: platform.name,
                                  utm_medium: platform.utm_medium || ""
                                });
                                setIsPlatformDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeletePlatform(platform.id, platform.name)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* UTM Mediums Tab */}
        <TabsContent value="mediums" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search mediums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { 
              setEditingMedium(null); 
              setMediumForm({ name: "", display_order: mediums?.length || 0 }); 
              setIsMediumDialogOpen(true); 
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medium
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMediumDragEnd}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mediumsLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-8">Loading...</TableCell></TableRow>
                    ) : filteredMediums.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No mediums found</TableCell></TableRow>
                    ) : (
                      <SortableContext items={filteredMediums.map(m => m.id)} strategy={verticalListSortingStrategy}>
                        {filteredMediums.map((medium) => (
                          <SortableRow key={medium.id} id={medium.id}>
                            <TableCell>{medium.display_order}</TableCell>
                            <TableCell className="font-medium">{medium.name}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingMedium(medium);
                                    setMediumForm({
                                      name: medium.name,
                                      display_order: medium.display_order
                                    });
                                    setIsMediumDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteMedium(medium.id, medium.name)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </SortableRow>
                        ))}
                      </SortableContext>
                    )}
                  </TableBody>
                </Table>
              </DndContext>
            </div>
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search campaigns..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Button onClick={() => { setEditingCampaign(null); setCampaignForm({ name: "", landing_page: "", campaign_type: "", description: "", display_order: 0 }); setIsCampaignDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Campaign
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Landing Page</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns?.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">{campaign.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{campaign.landing_page || "-"}</TableCell>
                  <TableCell>{campaign.usage_count || 0}</TableCell>
                  <TableCell className="text-xs">{campaign.last_used_at ? new Date(campaign.last_used_at).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingCampaign(campaign); setCampaignForm({ name: campaign.name, landing_page: campaign.landing_page || "", campaign_type: campaign.campaign_type || "", description: campaign.description || "", display_order: campaign.display_order || 0 }); setIsCampaignDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setCampaignToDelete({ id: campaign.id, name: campaign.name }); setIsDeleteCampaignDialogOpen(true); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Entity Dialog */}
      <Dialog open={isEntityDialogOpen} onOpenChange={setIsEntityDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntity ? "Edit Entity" : "Add Entity"}</DialogTitle>
            <DialogDescription>
              {editingEntity ? "Update the entity details." : "Add a new entity to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={entityForm.name} onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })} placeholder="UAE" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={entityForm.code} onChange={(e) => setEntityForm({ ...entityForm, code: e.target.value })} placeholder="uae" />
              </div>
              <div className="space-y-2">
                <Label>Emoji</Label>
                <Input value={entityForm.emoji} onChange={(e) => setEntityForm({ ...entityForm, emoji: e.target.value })} placeholder="🇦🇪" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website Param (Country Code)</Label>
              <CountryCodeSelect
                value={entityForm.website_param}
                onChange={(v) => setEntityForm({ ...entityForm, website_param: v })}
                customValue={entityForm.customWebsiteParam}
                onCustomChange={(v) => setEntityForm({ ...entityForm, customWebsiteParam: v })}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input type="number" value={entityForm.display_order} onChange={(e) => setEntityForm({ ...entityForm, display_order: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEntityDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEntitySubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* City Dialog */}
      <Dialog open={isCityDialogOpen} onOpenChange={setIsCityDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCity ? "Edit City" : "Add City"}</DialogTitle>
            <DialogDescription>
              {editingCity ? "Update the city details." : "Add a new city to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={cityForm.name} onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })} placeholder="Dubai" />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={cityForm.country} onChange={(e) => setCityForm({ ...cityForm, country: e.target.value })} placeholder="UAE" />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input type="number" value={cityForm.display_order} onChange={(e) => setCityForm({ ...cityForm, display_order: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCityDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCitySubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Platform Dialog */}
      <Dialog open={isPlatformDialogOpen} onOpenChange={setIsPlatformDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlatform ? "Edit Platform" : "Add Platform"}</DialogTitle>
            <DialogDescription>
              {editingPlatform ? "Update the platform details." : "Add a new platform to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={platformForm.name} onChange={(e) => setPlatformForm({ ...platformForm, name: e.target.value })} placeholder="Meta Ads" />
            </div>
            <div className="space-y-2">
              <Label>UTM Medium</Label>
              <Select value={platformForm.utm_medium} onValueChange={(v) => setPlatformForm({ ...platformForm, utm_medium: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select medium" />
                </SelectTrigger>
                <SelectContent>
                  {mediums?.map(m => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlatformDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePlatformSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medium Dialog */}
      <Dialog open={isMediumDialogOpen} onOpenChange={setIsMediumDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMedium ? "Edit UTM Medium" : "Add UTM Medium"}</DialogTitle>
            <DialogDescription>
              {editingMedium ? "Update the UTM medium details." : "Add a new UTM medium to the system."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={mediumForm.name} onChange={(e) => setMediumForm({ ...mediumForm, name: e.target.value })} placeholder="paid_social" />
            </div>
            <div className="space-y-2">
              <Label>Display Order</Label>
              <Input type="number" value={mediumForm.display_order} onChange={(e) => setMediumForm({ ...mediumForm, display_order: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMediumDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMediumSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmations */}
      <AlertDialog open={isDeleteEntityDialogOpen} onOpenChange={setIsDeleteEntityDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entity? This action cannot be undone and will affect all related data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteEntity}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Campaign Dialog */}
      <Dialog open={isCampaignDialogOpen} onOpenChange={setIsCampaignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCampaign ? "Edit Campaign" : "Add Campaign"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="Q1 2025 Promo" />
            </div>
            <div className="space-y-2">
              <Label>Landing Page</Label>
              <Input value={campaignForm.landing_page} onChange={(e) => setCampaignForm({ ...campaignForm, landing_page: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCampaignDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCampaignSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteCampaignDialogOpen} onOpenChange={setIsDeleteCampaignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCampaign}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteCityDialogOpen} onOpenChange={setIsDeleteCityDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this city? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteCity}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeletePlatformDialogOpen} onOpenChange={setIsDeletePlatformDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Platform</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this platform? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePlatform}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteMediumDialogOpen} onOpenChange={setIsDeleteMediumDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete UTM Medium</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this UTM medium? This action cannot be undone and may affect platforms using this medium.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteMedium}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
