import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Login() {
    const [formData, setFormData] = useState({
        email: "mridul@gmail.com",
        password: "1234",
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:4000/user/login", {
                method: "POST",
                body: JSON.stringify(formData),
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
            });
            const data = await response.json();
            console.log(data);
            if (data.success) {
                navigate("/");
            } else {
                setError(data.message);
                setTimeout(() => {
                    setError("");
                }, 2000);
            }
        } catch (error) {
            console.error(error.message);
        }
    };

    return (
        <div style={{ maxWidth: "400px", margin: "auto" }}>
            <h2>Login</h2>

            <form onSubmit={handleSubmit}>
                <div>
                    <label>Email</label>
                    <br />
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div>
                    <label>Password</label>
                    <br />
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                {error && <p>{error}</p>}
                <br />
                <div style={{
                    display: "flex",
                    gap: 80
                }}>
                    <button type="submit">Login</button>
                    <Link to={"/register"}>Register</Link>
                </div>
            </form>
        </div>
    );
}

export default Login;
