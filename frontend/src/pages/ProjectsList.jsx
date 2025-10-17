import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Rocket,
  Sparkles,
  Trash2,
  LogOut,
  ShieldCheck,
  XCircle
} from "lucide-react";
import axios from "axios";
import { API } from "../App";
import { useGlobalSearch } from "../context/GlobalSearchContext";
import { broadcastSessionLogout } from "../utils/session";
import { Button } from "components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "components/ui/card";
import { Input } from "components/ui/input";
import { Badge } from "components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "components/ui/alert";
import { Avatar, AvatarFallback } from "components/ui/avatar";
import { ScrollArea } from "components/ui/scroll-area";
import { Separator } from "components/ui/separator";

const ProjectsList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm } = useGlobalSearch();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const isEditor = ["admin", "editor"].includes(currentUser.role);
  const initials = (currentUser.username || "Planner")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    setSearchTerm("");
  }, [setSearchTerm]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (err) {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(`${API}/projects`, formData);
      setSuccess("Project created successfully!");
      setDialogOpen(false);
      setFormData({ name: "", description: "" });
      fetchProjects();
      setTimeout(() => setSuccess(""), 3200);
      navigate(`/projects/${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create project");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this project? All delivery intelligence will be lost."
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API}/projects/${projectId}`);
      setSuccess("Project deleted successfully!");
      fetchProjects();
      setTimeout(() => setSuccess(""), 3200);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete project");
    }
  };

  const handleLogout = () => {
    broadcastSessionLogout();
    setSearchTerm("");
    navigate("/login");
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredProjects = useMemo(
    () =>
      projects.filter((project) => {
        const haystack = `${project.name} ${project.description || ""}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      }),
    [normalizedSearch, projects]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      <div className="mx-auto flex w-full flex-col gap-10 px-6 py-10 sm:px-10">
        <section className="relative overflow-hidden rounded-3xl bg-white/90 p-10 text-slate-700 shadow-xl backdrop-blur-sm">
          <div className="absolute -left-32 top-20 h-56 w-56 rounded-full bg-sky-200/60 blur-3xl" aria-hidden="true" />
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-200/50 blur-3xl" aria-hidden="true" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <Badge className="bg-indigo-100 text-indigo-700 shadow-sm" variant="secondary">
                <Sparkles className="mr-1 h-4 w-4" />Toshiba Software India Private Ltd
              </Badge>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                Project Plan
              </h1>
              <p className="text-sm text-slate-600 sm:text-base">
                Launch, track, and nurture project plans across the organisation.
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1">
                  <Rocket className="h-4 w-4 text-indigo-500" />
                  <span>Showing {projects.length} Projects</span>
                </div>
              </div>
            </div>

            <Card className="w-full max-w-sm bg-white/95 text-slate-700 shadow-lg backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base text-slate-900">
                  {currentUser.username || "Planner"}
                </CardTitle>
                <CardDescription className="text-sm text-slate-500">
                  Welcome back — everything is up to date.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4 pb-0">
                <Avatar className="h-12 w-12 border border-indigo-100 bg-indigo-50">
                  <AvatarFallback className="bg-indigo-100 text-lg text-indigo-600">
                    {initials || "PM"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="capitalize">{currentUser.role || "viewer"}</span>
                  </div>
                  <p className="text-xs text-slate-500">Authenticated and synced</p>
                </div>
              </CardContent>
              <CardFooter className="mt-4 flex flex-wrap gap-2">
                {currentUser.role === "admin" && (
                  <Button
                    variant="outline"
                    className="border-slate-200 bg-white text-indigo-600 hover:bg-indigo-50"
                    onClick={() => navigate("/admin")}
                    data-testid="admin-dashboard-btn"
                  >
                    Command Centre
                  </Button>
                )}
                <Button
                  variant="destructive"
                  className="bg-rose-400 hover:bg-rose-500"
                  onClick={handleLogout}
                  data-testid="logout-btn"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          {success && (
            <Alert className="border border-emerald-200 bg-emerald-50 text-emerald-700">
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive" className="border border-red-200 bg-red-50 text-red-700">
              <AlertTitle>Something went wrong</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card className="bg-white text-slate-800 shadow-xl">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-2xl font-semibold text-slate-900">Plan Dashboard</CardTitle>
                <CardDescription className="text-slate-500">
                  Filter, launch, or revisit any project.
                </CardDescription>
              </div>
              {isEditor && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-indigo-500 hover:bg-indigo-600 text-white" data-testid="create-project-btn">
                      <Plus className="mr-2 h-4 w-4" /> Add Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="border border-slate-200 bg-white text-slate-700">
                    <DialogHeader>
                      <DialogTitle className="text-slate-900">Add Project</DialogTitle>
                      <DialogDescription className="text-slate-500">
                        Give your project a name and optional briefing .
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateProject} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600" htmlFor="project-name">
                          Project name
                        </label>
                        <Input
                          id="project-name"
                          required
                          value={formData.name}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, name: event.target.value }))
                          }
                          placeholder="Enter Project Name"
                          className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600" htmlFor="project-description">
                          Mission briefing (optional)
                        </label>
                        <textarea
                          id="project-description"
                          value={formData.description}
                          onChange={(event) =>
                            setFormData((prev) => ({ ...prev, description: event.target.value }))
                          }
                          placeholder="Enter Description."
                          className="min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                        />
                      </div>
                      <DialogFooter className="sm:justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-slate-500 hover:bg-slate-100"
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" className="bg-indigo-500 text-white hover:bg-indigo-600">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Project
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="global-search-status">
                  {searchTerm && (
                    <div className="search-status-active">
                      <span>
                        Filtering projects for <strong>"{searchTerm}"</strong>
                      </span>
                      <button
                        type="button"
                        className="clear-search-button"
                        onClick={() => setSearchTerm("")}
                        data-testid="clear-project-search"
                      >
                        <XCircle size={16} aria-hidden="true" />
                        <span>Clear global search</span>
                      </button>
                    </div>
                  )}
                </div>
                <Badge className="bg-indigo-100 text-indigo-600">
                  {filteredProjects.length} project{filteredProjects.length === 1 ? "" : "s"} in view
                </Badge>
              </div>
              <Separator className="border-slate-200" />

              {loading ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-slate-500">
                  <Sparkles className="h-6 w-6 animate-spin text-indigo-400" />
                  <p className="text-sm">Fetching mission telemetry...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500">
                  <p className="text-lg font-semibold text-slate-700">No missions detected</p>
                  <p className="mt-2 text-sm text-slate-500">
                    {searchTerm
                      ? "Try a different search query or clear your filters."
                      : "Launch your first project to light up the dashboard."}
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-full max-h-[600px] pr-2">
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {filteredProjects.map((project) => (
                      <Card
                        key={project.id}
                        className="group flex cursor-pointer flex-col justify-between border-slate-200 bg-white text-slate-800 transition duration-200 hover:border-indigo-200 hover:bg-indigo-50/40"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        data-testid={`project-card-${project.id}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600">
                                {project.name}
                              </CardTitle>
                              <CardDescription className="mt-2 text-sm text-slate-500">
                                {project.description || "No briefing supplied yet."}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-600">
                              {new Date(project.created_at).toLocaleDateString()}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardFooter className="flex items-center justify-between border-t border-slate-200">
                          <span className="text-xs uppercase tracking-wide text-slate-500">
                            PID: {project.id.split("-")[0]}
                          </span>
                          {isEditor && (
                            <Button
                              variant="ghost"
                              className="text-rose-500 hover:bg-rose-100"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteProject(project.id);
                              }}
                              data-testid={`delete-project-${project.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default ProjectsList;
