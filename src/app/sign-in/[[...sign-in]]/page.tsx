import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
            <div className="flex flex-col items-center w-full max-w-[430px]">
                {/* Logo */}
                <div className="flex items-center gap-2 mb-8">
                    <span className="text-3xl">💚</span>
                    <span className="font-black text-2xl text-gray-900">Health Buddy</span>
                </div>

                <SignIn
                    fallbackRedirectUrl="/dashboard"
                    appearance={{
                        variables: {
                            colorPrimary: "#22c55e",
                            colorBackground: "#ffffff",
                            borderRadius: "1rem",
                        },
                        elements: {
                            card: "shadow-none border border-gray-100 rounded-3xl",
                            headerTitle: "text-xl font-black text-gray-900",
                            formButtonPrimary: "bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl",
                            footerActionLink: "text-green-600 font-semibold hover:text-green-700",
                        },
                    }}
                />

                <p className="mt-6 text-sm text-gray-500">
                    Nie masz konta?{" "}
                    <a href="/sign-up" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
                        Zarejestruj się
                    </a>
                </p>
            </div>
        </div>
    );
}
