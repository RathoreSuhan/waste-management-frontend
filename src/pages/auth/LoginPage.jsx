import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

import useAuth from "@/hooks/useAuth";

import { loginSchema } from "@/schemas/authSchema";
import { getDashboardPath } from "@/utils/roleRedirect";

export default function LoginPage() {

    // Navigation
    const navigate = useNavigate();

    // Authentication
    const { login } = useAuth();

    // Backend error message
    const [serverError, setServerError] = useState("");

    /**
     * React Hook Form
     */
    const {

        register,

        handleSubmit,

        formState: {

            errors,

            isSubmitting,

        },

    } = useForm({

        resolver: zodResolver(loginSchema),

        defaultValues: {

            email: "",

            password: "",

        },

    });

    /**
     * Login Form Submit
     */
    async function onSubmit(data) {

        // Clear previous backend error
        setServerError("");

        try {

            // Login API
            const response = await login(data);

            // Redirect according to role
            navigate(getDashboardPath(response.role));

        } catch (error) {

            // Backend error message
            setServerError(

                error?.response?.data?.message ||

                "Something went wrong. Please try again."

            );

        }

    }

    return (

        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">

                <h1 className="mb-2 text-center text-3xl font-bold text-blue-700">

                    Welcome Back

                </h1>

                <p className="mb-6 text-center text-gray-500">

                    Login to Clean Bharat

                </p>

                {/* Backend Error */}

                {serverError && (

                    <div className="mb-5">

                        <Alert>

                            {serverError}

                        </Alert>

                    </div>

                )}

                <form

                    onSubmit={handleSubmit(onSubmit)}

                    className="space-y-5"

                >

                    <Input

                        label="Email"

                        type="email"

                        placeholder="Enter your email"

                        {...register("email")}

                        error={errors.email}

                    />

                    <Input

                        label="Password"

                        type="password"

                        placeholder="Enter your password"

                        {...register("password")}

                        error={errors.password}

                    />

                    <Button

                        type="submit"

                        loading={isSubmitting}

                    >

                        Login

                    </Button>

                </form>

                <p className="mt-6 text-center text-sm text-gray-600">

                    Don't have an account?

                    <Link

                        to="/register"

                        className="ml-1 font-semibold text-blue-700 hover:underline"

                    >

                        Register

                    </Link>

                </p>

            </div>

        </div>

    );

}