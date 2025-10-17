import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../App";
import { useGlobalSearch } from "../context/GlobalSearchContext";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Eye,
  EyeOff,
  PlusCircle,
  RefreshCw,
  Trash2,
  UserCog,
  XCircle
} from "lucide-react";
import { broadcastSessionLogout } from "../utils/session";
import ColumnVisibilityMenu from "../components/ColumnVisibilityMenu";

const ROLE_ORDER = ["viewer", "editor", "admin"];

const ROLE_METADATA = {
  viewer: {
    label: "Viewer",
    description: "Read-only visibility across the workspace."
  },
  editor: {
    label: "Editor",
    description: "Can update project content and collaborate with admins."
  },
  admin: {
    label: "Admin",
    description: "Full access including inviting teammates and managing roles."
  }
};

const USER_COLUMNS = [
  { key: "username", label: "Username" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "created_at", label: "Created At" }
];

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    role: "viewer"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userSort, setUserSort] = useState({ key: "username", direction: "asc" });
  const [draggedUserId, setDraggedUserId] = useState(null);
  const [dropTargetRole, setDropTargetRole] = useState(null);
  const [updatingUserIds, setUpdatingUserIds] = useState({});
  const [visibleUserColumns, setVisibleUserColumns] = useState(() =>
    USER_COLUMNS.reduce((acc, column) => {
      acc[column.key] = true;
      return acc;
    }, {})
  );
  const [accessOverrides, setAccessOverrides] = useState({});
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [activeAccessUser, setActiveAccessUser] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessSavingProject, setAccessSavingProject] = useState(null);
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const { searchTerm, setSearchTerm } = useGlobalSearch();

  useEffect(() => {
    fetchUsers();
    fetchProjects();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`${API}/projects`);
      setProjects(response.data);
    } catch (err) {
      setError("Failed to load projects");
    }
  };

  const createDefaultAccessMap = useCallback(() => {
    return projects.reduce((acc, project) => {
      acc[project.id] = true;
      return acc;
    }, {});
  }, [projects]);

  const buildAccessMap = useCallback(
    (entries) => {
      const map = createDefaultAccessMap();
      entries.forEach((entry) => {
        map[entry.project_id] = entry.visible;
      });
      return map;
    },
    [createDefaultAccessMap]
  );

  const ensureAccessMap = useCallback(
    (userId) => {
      if (accessOverrides[userId]) {
        return accessOverrides[userId];
      }
      return createDefaultAccessMap();
    },
    [accessOverrides, createDefaultAccessMap]
  );

  const fetchUserAccess = useCallback(
    async (userId) => {
      setAccessLoading(true);
      try {
        const response = await axios.get(`${API}/users/${userId}/project-access`);
        setAccessOverrides((prev) => ({
          ...prev,
          [userId]: buildAccessMap(response.data)
        }));
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load project access");
      } finally {
        setAccessLoading(false);
      }
    },
    [buildAccessMap]
  );

  const openAccessModal = async (user) => {
    setActiveAccessUser(user);
    setShowAccessModal(true);

    if (!projects.length) {
      await fetchProjects();
    }

    if (!accessOverrides[user.id]) {
      await fetchUserAccess(user.id);
    }
  };

  const closeAccessModal = () => {
    setShowAccessModal(false);
    setActiveAccessUser(null);
    setAccessSavingProject(null);
  };

  const handleProjectAccessToggle = async (projectId) => {
    if (!activeAccessUser) {
      return;
    }

    const currentMap = ensureAccessMap(activeAccessUser.id);
    const nextVisible = !(currentMap[projectId] ?? true);
    setAccessSavingProject(projectId);

    try {
      await axios.put(`${API}/users/${activeAccessUser.id}/project-access/${projectId}`, {
        visible: nextVisible
      });
      setAccessOverrides((prev) => {
        const current = prev[activeAccessUser.id] || createDefaultAccessMap();
        return {
          ...prev,
          [activeAccessUser.id]: {
            ...current,
            [projectId]: nextVisible
          }
        };
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update project access");
    } finally {
      setAccessSavingProject(null);
    }
  };

  const handleResetProjectAccess = async () => {
    if (!activeAccessUser) {
      return;
    }

    setAccessSavingProject("__reset__");
    try {
      await axios.delete(`${API}/users/${activeAccessUser.id}/project-access`);
      setAccessOverrides((prev) => ({
        ...prev,
        [activeAccessUser.id]: createDefaultAccessMap()
      }));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset project access");
    } finally {
      setAccessSavingProject(null);
    }
  };

  useEffect(() => {
    if (!projects.length) {
      return;
    }

    setAccessOverrides((prev) => {
      if (!Object.keys(prev).length) {
        return prev;
      }

      const next = {};
      for (const [userId, projectMap] of Object.entries(prev)) {
        const defaults = createDefaultAccessMap();
        for (const [projectId, isVisible] of Object.entries(projectMap)) {
          defaults[projectId] = isVisible;
        }
        next[userId] = defaults;
      }
      return next;
    });
  }, [projects, createDefaultAccessMap]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axios.post(`${API}/users`, formData);
      setSuccess("User created successfully!");
      setShowModal(false);
      setFormData({ email: "", username: "", password: "", role: "viewer" });
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`${API}/users/${userId}`);
      setSuccess("User deleted successfully!");
      fetchUsers();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete user");
    }
  };

  const handleLogout = () => {
    broadcastSessionLogout();
    setSearchTerm("");
    navigate("/login");
  };

  const handleUserSort = (columnKey) => {
    setUserSort((current) => {
      if (current.key === columnKey) {
        return {
          key: columnKey,
          direction: current.direction === "asc" ? "desc" : "asc"
        };
      }

      return { key: columnKey, direction: "asc" };
    });
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const hasSearch = Boolean(normalizedSearch);

  const filteredUsers = useMemo(() => {
    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) =>
      USER_COLUMNS.some((column) => {
        if (column.key === "created_at") {
          const dateText = new Date(user.created_at).toLocaleDateString();
          return dateText.toLowerCase().includes(normalizedSearch);
        }

        const value = user[column.key];
        if (value === null || value === undefined) {
          return false;
        }

        return String(value).toLowerCase().includes(normalizedSearch);
      })
    );
  }, [normalizedSearch, users]);

  const toggleUserColumnVisibility = (columnKey) => {
    setVisibleUserColumns((current) => {
      const visibleCount = USER_COLUMNS.reduce((total, column) => {
        return total + (current[column.key] !== false ? 1 : 0);
      }, 0);

      const isVisible = current[columnKey] !== false;

      if (isVisible && visibleCount === 1) {
        return current;
      }

      return { ...current, [columnKey]: isVisible ? false : true };
    });
  };

  const showAllUserColumns = () => {
    setVisibleUserColumns(
      USER_COLUMNS.reduce((acc, column) => {
        acc[column.key] = true;
        return acc;
      }, {})
    );
  };

  const displayedUserColumns = USER_COLUMNS.filter((column) => visibleUserColumns[column.key] !== false);

  const userTableData = useMemo(() => {
    const { key, direction } = userSort;
    if (!key) {
      return filteredUsers;
    }

    const multiplier = direction === "asc" ? 1 : -1;

    return [...filteredUsers].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];

      if (key === "created_at") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue === null || aValue === undefined) return 1 * multiplier;
      if (bValue === null || bValue === undefined) return -1 * multiplier;

      if (typeof aValue === "number" && typeof bValue === "number") {
        return (aValue - bValue) * multiplier;
      }

      const aString = String(aValue).toLowerCase();
      const bString = String(bValue).toLowerCase();

      if (aString < bString) return -1 * multiplier;
      if (aString > bString) return 1 * multiplier;
      return 0;
    });
  }, [filteredUsers, userSort]);

  const groupedUsers = useMemo(() => {
    return ROLE_ORDER.reduce((acc, role) => {
      acc[role] = filteredUsers.filter((user) => user.role === role);
      return acc;
    }, {});
  }, [filteredUsers]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);

  const activeAccessMap = activeAccessUser ? ensureAccessMap(activeAccessUser.id) : {};

  const isOwnAccount = (userId) => userId === currentUser.id;

  const isUpdating = (userId) => Boolean(updatingUserIds[userId]);

  const handleRoleUpdate = async (userId, nextRole) => {
    const targetUser = users.find((item) => item.id === userId);
    if (!targetUser || targetUser.role === nextRole) {
      return;
    }

    if (isOwnAccount(userId) && nextRole !== "admin") {
      setError("You cannot downgrade your own admin access.");
      return;
    }

    setError("");
    setSuccess("");
    setUpdatingUserIds((prev) => ({ ...prev, [userId]: true }));

    try {
      await axios.patch(`${API}/users/${userId}/role`, { role: nextRole });
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, role: nextRole } : user))
      );
      setSuccess(`Updated role to ${ROLE_METADATA[nextRole].label}.`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update role");
    } finally {
      setUpdatingUserIds((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    }
  };

  const handleDragStart = (event, userId) => {
    if (isOwnAccount(userId)) {
      return;
    }
    setDraggedUserId(userId);
    event.dataTransfer.setData("text/plain", userId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setDraggedUserId(null);
    setDropTargetRole(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (role) => {
    setDropTargetRole(role);
  };

  const handleDragLeave = (event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setDropTargetRole(null);
    }
  };

  const handleDrop = async (event, role) => {
    event.preventDefault();
    setDropTargetRole(null);
    const droppedId = event.dataTransfer.getData("text/plain") || draggedUserId;
    if (!droppedId) {
      return;
    }

    await handleRoleUpdate(droppedId, role);
    setDraggedUserId(null);
  };

  return (
    <div className="page-container admin-page">
      <div className="admin-layout">
        <div className="card admin-hero">
          <div>
            <h1 className="page-title">Admin Command Centre</h1>
            <p className="page-subtitle">Welcome, {currentUser.username}</p>
          </div>
          <div className="admin-hero-actions">
            <button
              className="btn btn-outline"
              onClick={() => navigate("/projects")}
              data-testid="view-projects-btn"
            >
              View Projects
            </button>
            <button className="btn btn-danger" onClick={handleLogout} data-testid="logout-btn">
              Logout
            </button>
          </div>
        </div>

        {success && <div className="success-message">{success}</div>}
        {error && <div className="error-message">{error}</div>}

        <section className="card role-centre">
          <h2 className="section-title">Role Command Centre</h2>
          <p className="muted-text">Drag and drop teammates between role lanes to update their access instantly.</p>
          <div className="role-kanban" role="list">
            {ROLE_ORDER.map((role) => (
              <div
                key={role}
                className={`role-column ${dropTargetRole === role ? "drag-over" : ""}`}
                onDragOver={handleDragOver}
                onDragEnter={() => handleDragEnter(role)}
                onDragLeave={handleDragLeave}
                onDrop={(event) => handleDrop(event, role)}
              >
                <div className="role-column-header">
                  <h3 className="role-column-title">{ROLE_METADATA[role].label}</h3>
                  <span className="role-column-count">
                    {groupedUsers[role]?.length || 0} member{(groupedUsers[role]?.length || 0) === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="role-column-description">{ROLE_METADATA[role].description}</p>
                <div className="role-column-body" role="list">
                  {groupedUsers[role]?.length ? (
                    groupedUsers[role].map((user) => (
                      <div
                        key={user.id}
                        role="listitem"
                        className={`role-user-card${draggedUserId === user.id ? " is-dragging" : ""}${isOwnAccount(user.id) ? " is-locked" : ""}`}
                        draggable={!isOwnAccount(user.id)}
                        onDragStart={(event) => handleDragStart(event, user.id)}
                        onDragEnd={handleDragEnd}
                        data-testid={`role-card-${user.id}`}
                      >
                        <span className="role-user-name">{user.username}</span>
                        <span className="role-user-email">{user.email}</span>
                        {isOwnAccount(user.id) && <span className="role-user-pill">You</span>}
                      </div>
                    ))
                  ) : (
                    <div className="role-column-empty">
                      {hasSearch ? "No matches for this role" : "Drop a user here"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="user-directory-header">
            <h3 className="section-subtitle">User Directory</h3>
            <div className="user-directory-actions">
              <div className="user-directory-messages">
                {searchTerm && (
                  <button
                    type="button"
                    className="clear-search-button"
                    onClick={() => setSearchTerm("")}
                    data-testid="clear-user-search"
                  >
                    <XCircle size={16} aria-hidden="true" />
                    <span>Clear global search</span>
                  </button>
                )}
              </div>
              <div className="user-directory-tools">
                <ColumnVisibilityMenu
                  columns={USER_COLUMNS}
                  visibleMap={visibleUserColumns}
                  onToggle={toggleUserColumnVisibility}
                  onShowAll={showAllUserColumns}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => setShowModal(true)}
                  data-testid="add-user-btn"
                >
                  <PlusCircle size={18} aria-hidden="true" />
                  <span>Create user</span>
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading users...</div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {displayedUserColumns.map((column) => {
                      const isSorted = userSort.key === column.key;
                      const SortIcon = !isSorted
                        ? ArrowUpDown
                        : userSort.direction === "asc"
                        ? ArrowUpAZ
                        : ArrowDownAZ;

                      return (
                        <th key={column.key}>
                          <button
                            type="button"
                            className="table-sort-button"
                            onClick={() => handleUserSort(column.key)}
                            aria-label={`Sort by ${column.label}`}
                          >
                            <span>{column.label}</span>
                            <SortIcon aria-hidden="true" size={16} />
                          </button>
                        </th>
                      );
                    })}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userTableData.length === 0 ? (
                    <tr>
                      <td colSpan={displayedUserColumns.length + 1} className="table-empty-state">
                        {users.length === 0
                          ? "No users available yet."
                          : "No users match the current filters."}
                      </td>
                    </tr>
                  ) : (
                    userTableData.map((user) => (
                      <tr key={user.id}>
                        {displayedUserColumns.map((column) => {
                          let content = user[column.key];

                          if (column.key === "role") {
                            content = (
                              <div className="role-cell">
                                <select
                                  className="role-select"
                                  value={user.role}
                                  onChange={(event) => handleRoleUpdate(user.id, event.target.value)}
                                  disabled={isOwnAccount(user.id) || isUpdating(user.id)}
                                >
                                  {ROLE_ORDER.map((role) => (
                                    <option value={role} key={role}>
                                      {ROLE_METADATA[role].label}
                                    </option>
                                  ))}
                                </select>
                                {isOwnAccount(user.id) && <span className="role-hint">Primary admin</span>}
                                {isUpdating(user.id) && <span className="role-hint">Saving…</span>}
                              </div>
                            );
                          }

                          if (column.key === "created_at") {
                            content = new Date(user.created_at).toLocaleDateString();
                          }

                          return (
                            <td key={column.key} data-label={column.label}>
                              {content}
                            </td>
                          );
                        })}
                        <td data-label="Actions">
                          <div className="table-actions">
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => openAccessModal(user)}
                              data-testid={`manage-access-${user.id}`}
                            >
                              <UserCog size={16} aria-hidden="true" />
                              <span>Access</span>
                            </button>
                            {!isOwnAccount(user.id) && (
                              <button
                                className="btn btn-danger btn-icon"
                                onClick={() => handleDeleteUser(user.id)}
                                data-testid={`delete-user-${user.id}`}
                                aria-label={`Delete ${user.username}`}
                              >
                                <Trash2 size={18} aria-hidden="true" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Create New User</h2>
                <button className="close-btn" onClick={() => setShowModal(false)} aria-label="Close">
                  <XCircle size={18} aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={handleCreateUser}>
                <div className="form-group">
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="new-user-email"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Username</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    data-testid="new-user-username"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className="input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    data-testid="new-user-password"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Role</label>
                  <select
                    className="input"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    data-testid="new-user-role"
                  >
                    {ROLE_ORDER.map((role) => (
                      <option value={role} key={role}>
                        {ROLE_METADATA[role].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="btn btn-primary" data-testid="submit-new-user">
                    Create User
                  </button>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showAccessModal && activeAccessUser && (
          <div className="modal-overlay" onClick={closeAccessModal}>
            <div
              className="modal-content project-access-modal"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="modal-header">
                <h2 className="modal-title">
                  Project visibility for {activeAccessUser.username}
                </h2>
                <button className="close-btn" onClick={closeAccessModal} aria-label="Close">
                  <XCircle size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="project-access-body">
                {accessLoading ? (
                  <div className="loading">Loading project access…</div>
                ) : sortedProjects.length === 0 ? (
                  <div className="project-access-empty">No projects available.</div>
                ) : (
                  <ul className="project-access-list">
                    {sortedProjects.map((project) => {
                      const isVisible = activeAccessMap[project.id] ?? true;
                      const isSaving = accessSavingProject === project.id;

                      return (
                        <li key={project.id} className="project-access-item">
                          <div className="project-access-details">
                            <h4>{project.name}</h4>
                            {project.description && <p>{project.description}</p>}
                          </div>
                          <button
                            type="button"
                            className={`project-access-toggle ${
                              isVisible ? "is-visible" : "is-hidden"
                            }${isSaving ? " is-saving" : ""}`}
                            onClick={() => handleProjectAccessToggle(project.id)}
                            disabled={accessLoading || Boolean(accessSavingProject)}
                          >
                            {isVisible ? (
                              <Eye size={16} aria-hidden="true" />
                            ) : (
                              <EyeOff size={16} aria-hidden="true" />
                            )}
                            <span>{isVisible ? "Visible" : "Hidden"}</span>
                            {isSaving && <span className="project-access-hint">Saving…</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="modal-actions project-access-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleResetProjectAccess}
                  disabled={
                    accessLoading ||
                    accessSavingProject === "__reset__" ||
                    sortedProjects.length === 0
                  }
                >
                  <RefreshCw size={16} aria-hidden="true" />
                  <span>Reset access</span>
                </button>
                <button type="button" className="btn btn-primary" onClick={closeAccessModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;