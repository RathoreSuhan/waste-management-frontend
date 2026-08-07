import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";

import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";

import { registerSchema } from "@/schemas/authSchema";
import * as authService from "@/services/authService";

export default function RegisterPage() {

    // Navigation
    const navigate = useNavigate();

    /**
     * React Hook Form
     */
    const {

        register,

        handleSubmit,

        watch,

        formState: {
            errors,
            isSubmitting,
        },

    } = useForm({

        resolver: zodResolver(registerSchema),

        defaultValues: {

            name: "",

            email: "",

            password: "",

            role: "ROLE_CITIZEN",

            cleanerType: "",

            organizationName: "",

            state: "",

            city: "",

        },

    });

    // Watch selected role
    const selectedRole = watch("role");

    /**
     * Form Submission
     */
    async function onSubmit(data) {

        // Register API
        await authService.register(data);

        // Move to login page
        navigate("/login");

    }

    return (

        <div className="flex min-h-screen items-center justify-center bg-gray-100">

            <div className="w-full max-w-xl rounded-xl bg-white p-8 shadow-lg">

                <h1 className="mb-2 text-center text-3xl font-bold text-blue-700">

                    Create Account

                </h1>

                <p className="mb-8 text-center text-gray-500">

                    Join Clean Bharat Platform

                </p>

                <form

                    onSubmit={handleSubmit(onSubmit)}

                    className="space-y-5"
                >

                    <Input

                        label="Full Name"

                        placeholder="Enter your name"

                        {...register("name")}

                        error={errors.name}

                    />

                    <Input

                        label="Email"

                        type="email"

                        placeholder="Enter email"

                        {...register("email")}

                        error={errors.email}

                    />

                    <Input

                        label="Password"

                        type="password"

                        placeholder="Minimum 6 characters"

                        {...register("password")}

                        error={errors.password}

                    />

                    <Select

                        label="Role"

                        {...register("role")}

                        error={errors.role}

                        options={[

                            {

                                label: "Citizen",

                                value: "ROLE_CITIZEN",

                            },

                            {

                                label: "Cleaner",

                                value: "ROLE_CLEANER",

                            },

                        ]}

                    />

                    {/* Cleaner fields */}

                    {selectedRole === "ROLE_CLEANER" && (

                        <>

                            <Select

                                label="Cleaner Type"

                                {...register("cleanerType")}

                                error={errors.cleanerType}

                                options={[

                                    {

                                        label: "Select Cleaner Type",

                                        value: "",

                                    },

                                    {

                                        label: "Individual",

                                        value: "INDIVIDUAL",

                                    },

                                    {

                                        label: "NGO",

                                        value: "NGO",

                                    },

                                    {

                                        label: "Private Company",

                                        value: "PRIVATE",

                                    },

                                    {

                                        label: "Municipal Corporation",

                                        value: "MUNICIPAL",

                                    },

                                ]}

                            />

                            <Input

                                label="Organization Name"

                                placeholder="Optional"

                                {...register("organizationName")}

                                error={errors.organizationName}

                            />

                        </>

                    )}

                    <Input

                        label="State"

                        placeholder="Enter state"

                        {...register("state")}

                        error={errors.state}

                    />

                    <Input

                        label="City"

                        placeholder="Enter city"

                        {...register("city")}

                        error={errors.city}

                    />

                    <Button

                        type="submit"

                        loading={isSubmitting}

                    >

                        Register

                    </Button>

                </form>

                <p className="mt-6 text-center text-sm">

                    Already have an account?

                    <Link

                        to="/login"

                        className="ml-1 font-semibold text-blue-600 hover:underline"

                    >

                        Login

                    </Link>

                </p>

            </div>

        </div>

    );

}