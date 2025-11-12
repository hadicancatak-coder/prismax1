import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useAllEntities, useCreateEntity, useUpdateEntity, useDeleteEntity } from "@/hooks/useSystemEntities";
import { useAllCities, useCreateCity, useUpdateCity, useDeleteCity } from "@/hooks/useSystemCities";
import { useUtmPlatforms, useCreatePlatform, useUpdatePlatform, useDeletePlatform } from "@/hooks/useUtmPlatforms";
import { useUtmMediums, useCreateMedium, useUpdateMedium, useDeleteMedium } from "@/hooks/useUtmMediums";

export default function SelectorsManagement() {
  const [activeTab, setActiveTab] = useState("entities");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Entity state
  const [isEntityDialogOpen, setIsEntityDialogOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState<any>(null);
  const [entityForm, setEntityForm] = useState({ name: "", code: "", emoji: "", display_order: 0, website_param: "" });
  
  // City state
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);
  const [cityForm, setCityForm] = useState({ name: "", country: "", display_order: 0 });
  
  // Platform state
  const [isPlatformDialogOpen, setIsPlatformDialogOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<any>(null);
  const [platformForm, setPlatformForm] = useState({ name: "", utm_medium: "" });
  
  // Medium state
  const [isMediumDialogOpen, setIsMediumDialogOpen] = useState(false);
  const [editingMedium, setEditingMedium] = useState<any>(null);
  const [mediumForm, setMediumForm] = useState({ name: "", display_order: 0 });

  // Hooks
  const { data: entities, isLoading: entitiesLoading } = useAllEntities();
  const { data: cities, isLoading: citiesLoading } = useAllCities();
  const { data: platforms, isLoading: platformsLoading } = useUtmPlatforms();
  const { data: mediums, isLoading: mediumsLoading } = useUtmMediums();

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

  // Entity handlers
  const handleEntitySubmit = async () => {
    if (editingEntity) {
      await updateEntity.mutateAsync({ id: editingEntity.id, ...entityForm });
    } else {
      await createEntity.mutateAsync({ ...entityForm, is_active: true });
    }
    setIsEntityDialogOpen(false);
    setEditingEntity(null);
    setEntityForm({ name: "", code: "", emoji: "", display_order: 0, website_param: "" });
  };

  const handleDeleteEntity = async (id: string) => {
    if (confirm("Are you sure you want to delete this entity?")) {
      await deleteEntity.mutateAsync(id);
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

  const handleDeleteCity = async (id: string) => {
    if (confirm("Are you sure you want to delete this city?")) {
      await deleteCity.mutateAsync(id);
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

  const handleDeletePlatform = async (id: string) => {
    if (confirm("Are you sure you want to delete this platform?")) {
      await deletePlatform.mutateAsync(id);
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

  const handleDeleteMedium = async (id: string) => {
    if (confirm("Are you sure you want to delete this UTM medium?")) {
      await deleteMedium.mutateAsync(id);
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Selectors Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage entities, cities, platforms, and UTM mediums
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="cities">Cities</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="mediums">UTM Mediums</TabsTrigger>
        </TabsList>

        {/* Entities Tab */}
        <TabsContent value="entities" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { setEditingEntity(null); setEntityForm({ name: "", code: "", emoji: "", display_order: 0, website_param: "" }); setIsEntityDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entity
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Emoji</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Website Param</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entitiesLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                ) : filteredEntities.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No entities found</TableCell></TableRow>
                ) : (
                  filteredEntities.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell>{entity.display_order}</TableCell>
                      <TableCell className="text-2xl">{entity.emoji}</TableCell>
                      <TableCell className="font-medium">{entity.name}</TableCell>
                      <TableCell><Badge variant="outline">{entity.code}</Badge></TableCell>
                      <TableCell>{entity.website_param || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingEntity(entity);
                              setEntityForm({
                                name: entity.name,
                                code: entity.code,
                                emoji: entity.emoji || "",
                                display_order: entity.display_order,
                                website_param: entity.website_param || ""
                              });
                              setIsEntityDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteEntity(entity.id)}>
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
        </TabsContent>

        {/* Cities Tab */}
        <TabsContent value="cities" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { setEditingCity(null); setCityForm({ name: "", country: "", display_order: 0 }); setIsCityDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add City
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {citiesLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                ) : filteredCities.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No cities found</TableCell></TableRow>
                ) : (
                  filteredCities.map((city) => (
                    <TableRow key={city.id}>
                      <TableCell>{city.display_order}</TableCell>
                      <TableCell className="font-medium">{city.name}</TableCell>
                      <TableCell>{city.country}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
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
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCity(city.id)}>
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
        </TabsContent>

        {/* Platforms Tab */}
        <TabsContent value="platforms" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search platforms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { setEditingPlatform(null); setPlatformForm({ name: "", utm_medium: "" }); setIsPlatformDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Platform
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>UTM Medium</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platformsLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                ) : filteredPlatforms.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No platforms found</TableCell></TableRow>
                ) : (
                  filteredPlatforms.map((platform: any) => (
                    <TableRow key={platform.id}>
                      <TableCell className="font-medium">{platform.name}</TableCell>
                      <TableCell><Badge>{platform.utm_medium || "Not set"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
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
                          <Button variant="ghost" size="icon" onClick={() => handleDeletePlatform(platform.id)}>
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
        </TabsContent>

        {/* UTM Mediums Tab */}
        <TabsContent value="mediums" className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search UTM mediums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => { setEditingMedium(null); setMediumForm({ name: "", display_order: 0 }); setIsMediumDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Medium
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mediumsLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center">Loading...</TableCell></TableRow>
                ) : filteredMediums.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No UTM mediums found</TableCell></TableRow>
                ) : (
                  filteredMediums.map((medium) => (
                    <TableRow key={medium.id}>
                      <TableCell>{medium.display_order}</TableCell>
                      <TableCell className="font-medium">{medium.name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
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
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteMedium(medium.id)}>
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
        </TabsContent>
      </Tabs>

      {/* Entity Dialog */}
      <Dialog open={isEntityDialogOpen} onOpenChange={setIsEntityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntity ? "Edit Entity" : "Add Entity"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="entity-name">Name</Label>
              <Input id="entity-name" value={entityForm.name} onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="entity-code">Code</Label>
              <Input id="entity-code" value={entityForm.code} onChange={(e) => setEntityForm({ ...entityForm, code: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="entity-emoji">Emoji</Label>
              <Input id="entity-emoji" value={entityForm.emoji} onChange={(e) => setEntityForm({ ...entityForm, emoji: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="entity-website">Website Param</Label>
              <Input id="entity-website" value={entityForm.website_param} onChange={(e) => setEntityForm({ ...entityForm, website_param: e.target.value })} placeholder="e.g., ae, sa, eg" />
            </div>
            <div>
              <Label htmlFor="entity-order">Display Order</Label>
              <Input id="entity-order" type="number" value={entityForm.display_order} onChange={(e) => setEntityForm({ ...entityForm, display_order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEntityDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEntitySubmit}>{editingEntity ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* City Dialog */}
      <Dialog open={isCityDialogOpen} onOpenChange={setIsCityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCity ? "Edit City" : "Add City"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="city-name">Name</Label>
              <Input id="city-name" value={cityForm.name} onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="city-country">Country</Label>
              <Input id="city-country" value={cityForm.country} onChange={(e) => setCityForm({ ...cityForm, country: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="city-order">Display Order</Label>
              <Input id="city-order" type="number" value={cityForm.display_order} onChange={(e) => setCityForm({ ...cityForm, display_order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCityDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCitySubmit}>{editingCity ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Platform Dialog */}
      <Dialog open={isPlatformDialogOpen} onOpenChange={setIsPlatformDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPlatform ? "Edit Platform" : "Add Platform"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="platform-name">Name</Label>
              <Input id="platform-name" value={platformForm.name} onChange={(e) => setPlatformForm({ ...platformForm, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="platform-medium">UTM Medium</Label>
              <Select value={platformForm.utm_medium} onValueChange={(value) => setPlatformForm({ ...platformForm, utm_medium: value })}>
                <SelectTrigger id="platform-medium">
                  <SelectValue placeholder="Select medium" />
                </SelectTrigger>
                <SelectContent>
                  {mediums?.map((medium) => (
                    <SelectItem key={medium.id} value={medium.name}>{medium.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlatformDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePlatformSubmit}>{editingPlatform ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medium Dialog */}
      <Dialog open={isMediumDialogOpen} onOpenChange={setIsMediumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMedium ? "Edit UTM Medium" : "Add UTM Medium"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="medium-name">Name</Label>
              <Input id="medium-name" value={mediumForm.name} onChange={(e) => setMediumForm({ ...mediumForm, name: e.target.value })} placeholder="e.g., paid_social, paid_search" />
            </div>
            <div>
              <Label htmlFor="medium-order">Display Order</Label>
              <Input id="medium-order" type="number" value={mediumForm.display_order} onChange={(e) => setMediumForm({ ...mediumForm, display_order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMediumDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMediumSubmit}>{editingMedium ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
