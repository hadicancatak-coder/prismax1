import { supabase } from "@/integrations/supabase/client";

export interface DependencyCheckResult {
  canDelete: boolean;
  dependencies: {
    tasks: number;
    utm_links: number;
    campaigns: number;
  };
}

export async function checkEntityDependencies(entityCode: string): Promise<DependencyCheckResult> {
  // Tasks where entity array contains this code
  const { count: taskCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .contains('entity', [entityCode]);
  
  // UTM links where entity array contains this code
  const { count: utmCount } = await supabase
    .from('utm_links')
    .select('*', { count: 'exact', head: true })
    .contains('entity', [entityCode]);
  
  // Campaigns where entity array contains this code
  const { count: campaignCount } = await supabase
    .from('launch_pad_campaigns')
    .select('*', { count: 'exact', head: true })
    .contains('entity', [entityCode]);
  
  const tasks = taskCount || 0;
  const utms = utmCount || 0;
  const campaigns = campaignCount || 0;
  
  return {
    canDelete: tasks === 0 && utms === 0 && campaigns === 0,
    dependencies: {
      tasks,
      utm_links: utms,
      campaigns
    }
  };
}

export async function checkCityDependencies(cityName: string): Promise<DependencyCheckResult> {
  // Tasks where city array contains this name
  const { count: taskCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .contains('city', [cityName]);
  
  // UTM links where city array contains this name
  const { count: utmCount } = await supabase
    .from('utm_links')
    .select('*', { count: 'exact', head: true })
    .contains('city', [cityName]);
  
  // Campaigns where city array contains this name
  const { count: campaignCount } = await supabase
    .from('launch_pad_campaigns')
    .select('*', { count: 'exact', head: true })
    .contains('city', [cityName]);
  
  const tasks = taskCount || 0;
  const utms = utmCount || 0;
  const campaigns = campaignCount || 0;
  
  return {
    canDelete: tasks === 0 && utms === 0 && campaigns === 0,
    dependencies: {
      tasks,
      utm_links: utms,
      campaigns
    }
  };
}

export async function checkPlatformDependencies(platformName: string): Promise<DependencyCheckResult> {
  const { count: utmCount } = await supabase
    .from('utm_links')
    .select('id', { count: 'exact', head: true })
    .eq('platform', platformName);
  
  return {
    canDelete: (utmCount || 0) === 0,
    dependencies: {
      tasks: 0,
      utm_links: utmCount || 0,
      campaigns: 0
    }
  };
}

export async function checkMediumDependencies(mediumName: string): Promise<DependencyCheckResult> {
  const { count: utmCount } = await supabase
    .from('utm_links')
    .select('id', { count: 'exact', head: true })
    .eq('utm_medium', mediumName);
  
  return {
    canDelete: (utmCount || 0) === 0,
    dependencies: {
      tasks: 0,
      utm_links: utmCount || 0,
      campaigns: 0
    }
  };
}

export function formatDependencyMessage(dependencies: DependencyCheckResult['dependencies']): string {
  const deps = Object.entries(dependencies)
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => `${count} ${name.replace('_', ' ')}`)
    .join(', ');
  
  return `Cannot delete because it is referenced in: ${deps}. Please remove those references first or contact support.`;
}
