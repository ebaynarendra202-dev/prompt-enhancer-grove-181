import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Users, BarChart3, Shield, Settings, Search,
  Eye, TrendingUp, FileText, Heart, Link2, Loader2, AlertTriangle, Plus, X
} from "lucide-react";
import { toast } from "sonner";

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading, stats, users, sharedPrompts, settings, loadAllData, updateSetting, assignRole, removeRole, fetchUserRoles } = useAdmin();
  const [userSearch, setUserSearch] = useState("");
  const [promptSearch, setPromptSearch] = useState("");
  const [newSettingKey, setNewSettingKey] = useState("");
  const [newSettingValue, setNewSettingValue] = useState("");
  const [userRolesMap, setUserRolesMap] = useState<Record<string, string[]>>({});
  const [roleToAdd, setRoleToAdd] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadAllData();
    }
  }, [isAdmin]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have admin privileges to access this page.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/app')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    !userSearch || (u.display_name?.toLowerCase().includes(userSearch.toLowerCase()))
  );

  const filteredPrompts = sharedPrompts.filter(p =>
    !promptSearch ||
    p.original_prompt.toLowerCase().includes(promptSearch.toLowerCase()) ||
    p.improved_prompt.toLowerCase().includes(promptSearch.toLowerCase())
  );

  const handleAddSetting = async () => {
    if (!newSettingKey.trim()) return;
    try {
      const parsed = newSettingValue ? JSON.parse(newSettingValue) : {};
      await updateSetting(newSettingKey.trim(), parsed);
      setNewSettingKey("");
      setNewSettingValue("");
    } catch {
      // invalid JSON
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/app')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-lg font-bold">Admin Dashboard</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="content" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Content
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1.5">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<FileText className="h-5 w-5" />} label="Total Improvements" value={stats?.total_improvements ?? 0} />
              <StatCard icon={<Link2 className="h-5 w-5" />} label="Shared Prompts" value={stats?.total_shared ?? 0} />
              <StatCard icon={<Heart className="h-5 w-5" />} label="Favorites" value={stats?.total_favorites ?? 0} />
              <StatCard icon={<Users className="h-5 w-5" />} label="Total Users" value={users.length} />
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Today</CardDescription>
                  <CardTitle className="text-2xl">{stats?.improvements_today ?? 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">improvements</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>This Week</CardDescription>
                  <CardTitle className="text-2xl">{stats?.improvements_this_week ?? 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">improvements</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>This Month</CardDescription>
                  <CardTitle className="text-2xl">{stats?.improvements_this_month ?? 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">improvements</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Platform Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Custom Templates</span><span className="font-medium">{stats?.total_templates ?? 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Prompt Chains</span><span className="font-medium">{stats?.total_chains ?? 0}</span></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="max-w-sm"
              />
              <Badge variant="secondary">{filteredUsers.length} users</Badge>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(u => (
                    <TableRow key={u.user_id}>
                      <TableCell className="font-medium">{u.display_name || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{u.user_id.slice(0, 8)}...</TableCell>
                      <TableCell className="text-sm">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">No users found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Content Moderation Tab */}
          <TabsContent value="content" className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shared prompts..."
                value={promptSearch}
                onChange={e => setPromptSearch(e.target.value)}
                className="max-w-sm"
              />
              <Badge variant="secondary">{filteredPrompts.length} shared prompts</Badge>
            </div>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Share ID</TableHead>
                    <TableHead>Original Prompt</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrompts.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.share_id}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">{p.original_prompt}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{p.ai_model}</Badge></TableCell>
                      <TableCell className="flex items-center gap-1"><Eye className="h-3 w-3" />{p.view_count}</TableCell>
                      <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {filteredPrompts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No shared prompts found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">App Settings</CardTitle>
                <CardDescription>Manage application-wide configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Key</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {settings.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-sm">{s.key}</TableCell>
                          <TableCell className="text-sm max-w-[300px] truncate">{JSON.stringify(s.value)}</TableCell>
                          <TableCell className="text-sm">{new Date(s.updated_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No settings configured yet.</p>
                )}
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Add / Update Setting</p>
                  <div className="flex gap-2">
                    <Input placeholder="Key" value={newSettingKey} onChange={e => setNewSettingKey(e.target.value)} className="max-w-[200px]" />
                    <Input placeholder='Value (JSON)' value={newSettingValue} onChange={e => setNewSettingValue(e.target.value)} className="flex-1" />
                    <Button onClick={handleAddSetting} size="sm">Save</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardDescription>{label}</CardDescription>
      <span className="text-muted-foreground">{icon}</span>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </CardContent>
  </Card>
);

export default Admin;
