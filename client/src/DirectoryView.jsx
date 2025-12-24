import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const DirectoryView = () => {
    const [directoriesList, setDirectoriesList] = useState([]);
    const [filesList, setFilesList] = useState([]);
    const [progress, setProgress] = useState(0);
    const [oldName, setOldName] = useState("");
    const [newName, setNewName] = useState("");
    const [dirname, setDirname] = useState("");
    const [error, setError] = useState("");
    const inputRef = useRef(null);
    const { dirId } = useParams();
    const navigate = useNavigate();

    async function fetchDirFiles() {
        try {
            const response = await fetch(
                `http://localhost:4000/directory/${dirId || ""}`,
                {
                    credentials: "include",
                }
            );
            const data = await response.json();
            if (data.success) {
                setDirectoriesList(data.directory.content.directories);
                setFilesList(data.directory.content.files);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error("Error fetching directory files:", error);
        }
    }

    useEffect(() => {
        async function fetchData() {
            await fetchDirFiles();
        }
        fetchData();
    }, [dirId]);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `http://localhost:4000/file/${file.name}`, true);
        xhr.withCredentials = true;
        xhr.upload.addEventListener("progress", (e) => {
            const percent = (e.loaded / e.total) * 100;
            setProgress(percent.toFixed(2));
        });
        xhr.setRequestHeader("parentdirid", dirId || "");
        xhr.send(file);
        xhr.onload = async () => {
            if (xhr.status === 200) {
                alert("File uploaded successfully");
                await fetchDirFiles();
            } else {
                alert("File upload failed");
            }
        };
    };

    const handleRename = async (id) => {
        try {
            await fetch(`http://localhost:4000/file/rename/${id}`, {
                method: "PATCH",
                credentials: "include",
                body: JSON.stringify({ newfilename: newName }),
                headers: {
                    "Content-Type": "application/json",
                },
            });
            await fetchDirFiles();
            setOldName("");
            setNewName("");
        } catch (error) {
            console.error("Error renaming file:", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`http://localhost:4000/file/delete/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            await fetchDirFiles();
        } catch (error) {
            console.error("Error deleting file:", error);
        }
    };

    const handleRenameClick = (filename) => {
        setOldName(filename);
        setNewName(filename);

        requestAnimationFrame(() => {
            const input = inputRef.current;
            if (!input) return;

            const dotIndex = filename?.lastIndexOf(".");
            const selectEnd = dotIndex > 0 ? dotIndex : filename.length;
            input.focus();
            input.setSelectionRange(0, selectEnd);
        });
    };

    const handleCreateDirectory = async () => {
        try {
            await fetch(`http://localhost:4000/directory/${dirId || ""}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    dirname,
                },
                credentials: "include",
            });
            await fetchDirFiles();
            setDirname("");
        } catch (error) {
            console.error("Error creating directory:", error);
        }
    };

    const handleDirectorySave = async (id) => {
        try {
            await fetch(`http://localhost:4000/directory/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ newdirname: newName }),
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            await fetchDirFiles();
            setOldName("");
            setNewName("");
        } catch (error) {
            console.error("Error renaming directory:", error);
        }
    };

    const handleDirectoryDelete = async (id) => {
        try {
            await fetch(`http://localhost:4000/directory/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            await fetchDirFiles();
        } catch (error) {
            console.error("Error deleting directory:", error);
        }
    };

    const handleLogOut = async () => {
        try {
            const response = await fetch("http://localhost:4000/user/logout", {
                method: "POST",
                credentials: "include",
            });
            const data = await response.json();
            console.log(data);
            if (data.success) {
                navigate("/login");
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    if (error) {
        return (
            <p>
                {error} go to <Link to={"/login"}>login</Link> page
            </p>
        );
    }

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 500,
                }}
            >
                <div>
                    <h1>My Files</h1>
                </div>
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                    }}
                >
                    <Link to={"/login"}>Login</Link>
                    <button onClick={handleLogOut}>logout</button>
                </div>
            </div>
            <div>
                <div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <input type="file" onChange={handleFileUpload} />
                        <div>
                            <div>
                                <label>Old name : </label>
                                <input type="text" value={oldName} />
                            </div>
                            <div>
                                <label>New name : </label>
                                <input
                                    type="text"
                                    value={newName}
                                    ref={inputRef}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div>Upload Progress: {progress}%</div>
                    <div>
                        <label>Create Directory : </label>
                        <input
                            type="text"
                            value={dirname}
                            onChange={(e) => setDirname(e.target.value)}
                        />
                        <button onClick={handleCreateDirectory}>save</button>
                    </div>
                </div>
                <ul>
                    {directoriesList?.map((dir) => {
                        if (!dir) return null;

                        const { name, id } = dir;

                        return (
                            <li key={id}>
                                {name} <Link to={`/directory/${id}`}>open</Link>
                                <button onClick={() => handleRenameClick(name)}>
                                    rename
                                </button>
                                <button onClick={() => handleDirectorySave(id)}>
                                    save
                                </button>
                                <button
                                    onClick={() => handleDirectoryDelete(id)}
                                >
                                    delete
                                </button>
                            </li>
                        );
                    })}
                </ul>
                <ul>
                    {filesList?.map((file) => {
                        if (!file) return null;

                        const { name, id } = file;

                        return (
                            <li key={id}>
                                {name}{" "}
                                <Link to={`http://localhost:4000/file/${id}`}>
                                    preview
                                </Link>{" "}
                                <a
                                    href={`http://localhost:4000/file/${id}?action=download`}
                                >
                                    download
                                </a>
                                <button
                                    onClick={() => handleRenameClick(name, id)}
                                >
                                    rename
                                </button>
                                <button onClick={() => handleRename(id)}>
                                    save
                                </button>
                                <button onClick={() => handleDelete(id)}>
                                    delete
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default DirectoryView;
