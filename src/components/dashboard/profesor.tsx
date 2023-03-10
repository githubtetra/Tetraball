import React, { ChangeEvent, useEffect, useState } from "react";
import axios from "axios";
import api from "../../hooks/hooks"
import '../css/styles.css'
import * as XLSX from 'xlsx';

interface User {
    id: number;
    name: string;
    lastname: string;
    email: string;
    password: string;
    group: number;
    subgroup: number | null;
    role: number;
}

interface Group {
    id: number;
    type: string; // "primary" or "secondary"
    label: string;
    id_tutor: number | null; // null if it is a secondary group
}

interface Quest {
    id: number;
    label: string;
}

interface QuestGroup {
    id: number;
    label: string;
    id_quest: number;
    id_group: number;
    status: boolean;
}

interface Activity {
    id: number;
    id_activity: number;
    status: boolean;
    title: string;
    description: string;
    id_quest: number;
}

let group_profesor = -1;
let subgroup_profesor = -1;

const Profesor = () => {

    const number_to_Role = (role: number): string => {
        switch (role) {
            case 1:
                return "Admin";
            case 2:
                return "Tutor";
            case 3:
                return "Profesor";
            case 4:
                return "Estudiante";
            default:
                return "Error";
        }
    };


    // TODO: Users
    const [users, setUsers] = React.useState<User[]>([]);
    const [editingUser, setEditingUser] = React.useState<boolean>(false);
    const [newuser, setNewUser] = React.useState<User>({
        id: 0,
        name: "",
        lastname: "",
        email: "",
        password: "",
        group: 0,
        subgroup: 0,
        role: 0,
    });
    const [editCurrentUser, setEditCurrentUser] = React.useState<User>({
        id: 0,
        name: "",
        lastname: "",
        email: "",
        password: "",
        group: 0,
        subgroup: 0,
        role: 0,
    });

    const getUsers: Function = async (): Promise<void> => {
        const res = await api.getAllUsers();
        let all_users = res.data;
        let tutor_id = localStorage.getItem("id");
        console.log("Tutor id: " + tutor_id);

        // Find the tutor's group
        if (group_profesor == -1) {
            let tutor_group = -1;
            for (let i = 0; i < all_users.length; i++) {
                console.log(all_users[i].id + " " + tutor_id);
                if (all_users[i].id == tutor_id) {
                    console.log("Tutor group: " + all_users[i].group);
                    tutor_group = all_users[i].group;
                    group_profesor = tutor_group;
                    localStorage.setItem("sub_group", tutor_group.toString());
                    break;
                }
            }
        }

        let re = await api.getUserById(tutor_id);
        subgroup_profesor = re.data.subgroup;

        if (group_profesor == -1) {
            console.log("Error: Tutor group not found:" + group_profesor);
            alert("Error: Tutor group not found");
            return;
        }
        // Filter the users that are in the tutor's group
        let tutor_users = all_users.filter((user: User) => user.group === group_profesor);

        console.log(tutor_users);

        setUsers(tutor_users);
    };

    const addUser: Function = async (user: User): Promise<void> => {
        if (group_profesor == -1) {
            console.log("Error: Tutor group not found:" + group_profesor);
            alert("Error: Tutor group not found");
            getUsers();
            return;
        } else if (subgroup_profesor == -1) {
            console.log("Error: Tutor subgroup not found:" + subgroup_profesor);
            alert("Error: Tutor subgroup not found");
            getUsers();
            return;
        }
        user.group = group_profesor;
        user.role = 4;
        user.subgroup = subgroup_profesor;

        if (user.name === "" || user.lastname === "" || user.email === "") {
            alert("Please fill all the fields");
            return;
        }

        if (user.email.indexOf("@") === -1) {
            alert("Please enter a valid email");
            return;
        }

        await api.addUser(user);
        setNewUser({
            id: 0,
            name: "",
            lastname: "",
            email: "",
            password: "",
            group: group_profesor,
            subgroup: subgroup_profesor,
            role: 4,
        });
        getUsers();
    };

    const getUserName: Function = (id: number): string => {
        let name = "";
        let res = users.filter((user: User) => user.id === id);
        if (res.length > 0) {
            name = res[0].name + " " + res[0].lastname;
        }

        return name;
    };

    const deleteUser: Function = async (id: number): Promise<void> => {
        await api.deleteUser(id);
        getUsers();
    };

    const editUser: Function = (user: User): void => {
        setEditingUser(true);
        setEditCurrentUser(user);
    };

    const updateUser: Function = async (id: number, updatedUser: User): Promise<void> => {
        setEditingUser(false);
        await api.updateUser(id, updatedUser);
        getUsers();
    };

    // TODO: Groups
    const [groups, setGroups] = React.useState<Group[]>([]);
    const [editingGroup, setEditingGroup] = React.useState<boolean>(false);

    const [newgroup, setNewGroup] = React.useState<Group>({
        id: 0,
        type: "",
        label: "",
        id_tutor: 0,
    });

    const [editCurrentGroup, setEditCurrentGroup] = React.useState<Group>({
        id: 0,
        type: "",
        label: "",
        id_tutor: 0,
    });

    const getGroups: Function = async (): Promise<void> => {
        const res = await api.getTutorSubgroups(localStorage.getItem("id"));
        console.log(res);
        setGroups(res.group);
    };

    const addGroup: Function = async (group: Group): Promise<void> => {
        if (group.label === "") {
            alert("Please fill all the fields");
            return;
        }

        if (group_profesor == -1) {
            console.log("Error: Tutor group not found:" + group_profesor);
            alert("Error: Tutor group not found");
            getGroups();
            return;
        }

        setNewGroup({
            id: 0,
            type: "subgroup",
            label: "",
            id_tutor: group_profesor,
        });


        await api.addSecondaryGroup(group.label, group_profesor);
        getGroups();
    };


    // Actividades
    const [actividades, setActividades] = useState<Quest[]>([]);
    const [currentQuests, setCurrentQuests] = useState<QuestGroup[]>([]);

    const getAllQuests: Function = async (): Promise<void> => {
        const res = await api.getAllQuests();

        for (let index = 0; index < res.data.length; index++) {
            const element = res.data[index];
            console.log("aaaa" + element.label);
            let a: Quest = {
                id: element.id,
                label: element.label,
            }

            actividades.push(a);
        }

        await getCurrentQuests();
    };

    const getCurrentQuests: Function = async (): Promise<void> => {
        if (actividades.length == 0) {
            console.log("No activities found yet " + actividades.length);
            // Sleep for 1 second and then try again
            setTimeout(getCurrentQuests, 1000);
            return;
        }

        const res = await api.getQuestsStatus();
        let final: QuestGroup[] = [];

        for (let i = 0; i < actividades.length; i++) {
            let found = false;
            let status = false;
            console.log("IN" + actividades[i].label);

            for (let j = 0; j < res.data.length; j++) {
                if (actividades[i].id == res.data[j].id_quest && res.data[j].id_group == group_profesor) {
                    found = true;
                    status = res.data[j].status == 1 ? true : false;
                    console.log("Shit is active or not? " + status + " " + res.data[j].status);
                    break;
                }
            }

            if (!found) {
                console.log("Not found" + actividades[i].label);
                final.push({
                    id: 0,
                    label: actividades[i].label,
                    id_quest: actividades[i].id,
                    id_group: group_profesor,
                    status: false,
                });
            } else {
                console.log("Found");
                final.push({
                    id: 0,
                    label: actividades[i].label,
                    id_quest: actividades[i].id,
                    id_group: group_profesor,
                    status: status,
                });
            }
        }

        // Loop through the final array and search for repeated elements and remove the one with status false
        for (let i = 0; i < final.length; i++) {
            for (let j = i + 1; j < final.length; j++) {
                if (final[i].id_quest == final[j].id_quest) {
                    console.log("Equal");
                    // If the status is false, remove the element, otherwise remove the other one
                    // If both are the same status, remove the second one
                    if (final[i].status == false && final[j].status == false) {
                        final.splice(j, 1);
                    } else if (final[i].status == true && final[j].status == false) {
                        final.splice(j, 1);
                    } else if (final[i].status == false && final[j].status == true) {
                        final.splice(i, 1);
                    } else {
                        final.splice(j, 1);
                    }
                } else {
                    console.log("Not equal");
                }
            }
        }
        setCurrentQuests(final);
        getAllActivites(final);
    };

    const changeActivityState: Function = async (id_quest: number, id_group: number, status: boolean): Promise<void> => {
        console.log("Change activity state" + id_quest + " " + id_group + " " + status + " " + (status === true ? 0 : 1));
        await api.changeQuestStatus(id_quest, id_group, status === true ? 0 : 1);
        // window.location.reload();
        await getCurrentQuests();
    };



    const [allActivites, setAllActivites] = useState<Activity[]>([]);

    const getAllActivites: Function = async (q: QuestGroup[]): Promise<void> => {
        if (currentQuests.length == 0 && q.length == 0) {
            console.log("No activities found yet " + q.length);
            // Sleep for 1 second and then try again
            setTimeout(getAllActivites, 1000);
            return;
        }

        const act: Activity[] = [];

        // if (currentQuests.length > 0) {
        //     currentQuests.forEach(async element => {
        //         if (element.id != null && element.id_group == group_profesor) {
        //             console.log("Getting activities for A " + element.label);
        //             const rest = await api.getGroupActivities(group_profesor, element.id);
                    
        //             console.log("REST")
        //             console.log(rest)

        //             let idq: number = element.id_quest;

        //             for (let index = 0; index < rest.data.length; index++) {
        //                 console.log("IDDDDDDD" + rest.data[rest.data[index].id].id);
        //                 const element = rest.data[index];
        //                 let a: Activity = {
        //                     id: rest.data[index].id,
        //                     id_quest: idq,
        //                     title: rest.data[index].title,
        //                     description: rest.data[index].description,
        //                     status: rest.data[index].status == 1 ? true : false,
        //                 }

        //                 act.push(a);
        //             }
        //         }
        //     });
        // } 
        if (q.length > 0) {
            q.forEach(async element => {
                if (element.id != null && element.id_group == group_profesor) {
                    console.log("Getting activities for B " + element.label);
                    const rest = await api.getGroupActivities(group_profesor, element.id_quest);

                    console.log("REST B + " + rest.data.length)

                    let idq: number = element.id_quest;

                    for (let index = 0; index < rest.data.length; index++) {
                        console.log("REST B + For " + rest.data.length)
                        console.log(rest.data)
                        console.log("IDDDDDDD" + rest.data[index].id);
                        const element = rest.data[index];
                        let a: Activity = {
                            id: rest.data[index].id,
                            id_quest: idq,
                            id_activity: rest.data[index].id_actividad,
                            title: rest.data[index].title,
                            description: rest.data[index].description,
                            status: rest.data[index].status == 1 ? true : false,
                        }

                        console.log("Activity + " + idq + " " + rest.data.length);
                        console.log(act);

                        act.push(a);
                    }
                }
            });
        }

        setAllActivites(act);
    }

    const chngActivityState: Function = async (id: number, id_quest: number, status: boolean): Promise<void> => {
        await api.changeGroupActivityState(subgroup_profesor, id_quest, status === true ? 0 : 1);

        window.location.reload();
    }



    // File
    const [file, setFile] = useState<File | null>(null);

    const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    }

    const handleRead = async (): Promise<void> => {

        if (!file) {
            alert("Please select a file");
            return;
        }

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target) {
                    const bstr = e.target.result;
                    const wb = XLSX.read(bstr, { type: "binary" });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws);
                    console.log(data);

                    for (let i = 0; i < data.length; i++) {
                        const element: any = data[i];
                        const student: User = {
                            id: 0,
                            name: element["Nombre"],
                            lastname: element["Apellido"],
                            email: element["Correo"],
                            group: group_profesor,
                            subgroup: subgroup_profesor,
                            role: 4,
                            password: "",
                        }

                        addUser(student);
                    }

                }
            }

            reader.readAsBinaryString(file);
        }

        // Reload page
        window.location.reload();
    }

    useEffect(() => {
        getUsers();
        getGroups();
        getAllQuests();
    }, []);

    return (
        <div>
            <h1>Profesor</h1>

            {/* Manage Quests */}
            <h2>Actividades</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        currentQuests.map((activity) => (
                            <tr key={activity.id}>
                                <td>{activity.id}</td>
                                <td>{activity.label}</td>
                                <td>{activity.status ? "Activo" : "Inactivo"}</td>
                                <td>
                                    <button type="button" onClick={() => {
                                        console.log("aaaa")
                                        console.log("activity" + activity.id_quest + " " + activity.id_group + " " + activity.status);
                                        changeActivityState(activity.id_quest, activity.id_group, activity.status);
                                    }}>{activity.status ? "Desactivar" : "Activar"}</button>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>



            {/* Manage Activities */}
            <h2>Actividades</h2>
            <button onClick={
                () => {
                    setAllActivites([...allActivites]);
                    console.log(allActivites);
                }
            }>Cargar</button>
            {
                currentQuests.map((quest) => (
                    <div>
                        <h3>{quest.label}</h3>
                        <table key={quest.id}>
                            <thead>
                                <tr>
                                    <th>{quest.label}</th>
                                    <th>Estado: {quest.status ? "Activo" : "Inactivo"}</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {
                                    // Wait for allActivites to have data
                                    allActivites.map((ac) => (
                                        ac.id_quest == quest.id_quest ?
                                            <>
                                                {
                                                    <tr key={ac.id}>
                                                        <td>{ac.title}</td>
                                                        <td>{ac.status ? "Activo" : "Inactivo"}</td>
                                                        <td>
                                                            <button type="button" onClick={() => {
                                                                chngActivityState(ac.id, ac.id_activity, ac.status);
                                                            }}>{ac.status ? "Desactivar" : "Activar"}</button>
                                                        </td>
                                                    </tr>
                                                }
                                            </>
                                            :
                                            <></>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                ))
            }


            {/* Add Profesor */}
            <h2>Add Estudiante</h2>
            <form>
                <label>Name</label>
                <input type="text" name="name" value={newuser.name} onChange={(e) => setNewUser({ ...newuser, name: e.target.value })} />
                <label>Lastname</label>
                <input type="text" name="lastname" value={newuser.lastname} onChange={(e) => setNewUser({ ...newuser, lastname: e.target.value })} />
                <label>Email</label>
                <input type="email" name="email" value={newuser.email} onChange={(e) => setNewUser({ ...newuser, email: e.target.value })} />


                <button type="button" onClick={() => {
                    addUser(newuser)
                }}>Add Profesor</button>
            </form>

            <br></br>
            <label>Subir archivo con alumnos: </label>
            <input type={"file"} onChange={handleFile} accept=".xlsx" />
            {/* <div>{file && `${file.name} - ${file.type}`}</div> */}
            <button onClick={handleRead}>Upload</button>
            {/* Descargar plantilla */}

            <button disabled>Descargar plantilla</button>

            {/* See all users */}
            <h2>All Users</h2>
            <table>
                <thead>
                    <tr>
                        <th>Id</th>
                        <th>Name</th>
                        <th>Lastname</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        users.map((user: User) => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.name}</td>
                                <td>{user.lastname}</td>
                                <td>{user.email}</td>
                                <td>
                                    {
                                        number_to_Role(user.role)
                                    }
                                </td>
                                <td>
                                    <button onClick={() => {
                                        editUser(user)
                                    }}>Edit</button>
                                    <button onClick={() => {
                                        deleteUser(user.id)
                                    }}>Delete</button>
                                </td>
                            </tr>
                        ))
                    }
                </tbody>
            </table>


            {/* Edit Student */}
            {
                editingUser ? (
                    <div className="edit-user">
                        <h2>Editar usuario</h2>
                        <form>
                            <div className="editblock">
                                <label>Nombre:</label>
                                <input type="text" value={editCurrentUser.name} onChange={(e) => setEditCurrentUser({ ...editCurrentUser, name: e.target.value })} />
                            </div>

                            <div className="editblock">
                                <label>Apellido: </label>
                                <input type="text" value={editCurrentUser.lastname} onChange={(e) => setEditCurrentUser({ ...editCurrentUser, lastname: e.target.value })} />
                            </div>

                            <div className="editblock">
                                <label>Email: </label>
                                <input type="text" value={editCurrentUser.email} onChange={(e) => setEditCurrentUser({ ...editCurrentUser, email: e.target.value })} />
                            </div>

                            <button type="button" onClick={() => {
                                updateUser(editCurrentUser.id, editCurrentUser)
                            }}>Guardar</button>
                            <button>Cancelar</button>
                        </form>
                    </div>
                ) : (
                    <div>
                    </div>
                )
            }

        </div>
    );
};

export default Profesor;
