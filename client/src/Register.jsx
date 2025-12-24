import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
    const [formData, setFormData] = useState({
        name: "Mridul",
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
        console.log("Register Data:", formData);
        const response = await fetch("http://localhost:4000/user", {
            method: "POST",
            body: JSON.stringify(formData),
            headers: {
                "Content-Type": "application/json",
            },
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
    };

    return (
        <div style={{ maxWidth: "400px", margin: "auto" }}>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Name</label>
                    <br />
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

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
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 80,
                    }}
                >
                    <button type="submit">Register</button>
                    <Link to={"/login"}>Login</Link>
                </div>
            </form>
        </div>
    );
}

export default Register;
