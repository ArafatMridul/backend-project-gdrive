import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DirectoryView from "./DirectoryView.jsx";
import Register from "./Register.jsx";
import Login from "./Login.jsx";

const router = createBrowserRouter([
    {
        path: "/",
        element: <DirectoryView />,
    },
    {
        path: "/register",
        element: <Register />,
    },
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/directory/:dirId",
        element: <DirectoryView />,
    },
]);

const App = () => {
    return <RouterProvider router={router} />;
};

export default App;
