import { useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Header, { Logo } from "./components/Header.jsx";
import { EmptyState, RequireAuth } from "./components/ui.jsx";
import Home from "./pages/Home.jsx";
import PlacePage from "./pages/PlacePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import { AccountLayout, Profile } from "./pages/Account.jsx";
import { MyBookings, BookingDetail } from "./pages/Bookings.jsx";
import { MyPlaces, PlaceForm } from "./pages/Places.jsx";

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => window.scrollTo(0, 0), [pathname]);
    return null;
}

function Footer() {
    return (
        <footer className="mt-16 border-t border-slate-200 bg-slate-50">
            <div className="page flex flex-col items-center justify-between gap-4 py-8 text-sm text-slate-500 sm:flex-row">
                <Logo />
                <p>
                    A portfolio project by{" "}
                    <a href="https://my-portfoliosite07.netlify.app" className="font-semibold text-slate-700 underline">Rahul Yadav</a>
                    {" · "}
                    <a href="https://github.com/An0nRaptor/Booking_webapp" className="underline">Source on GitHub</a>
                </p>
            </div>
        </footer>
    );
}

export default function App() {
    return (
        <div className="flex min-h-screen flex-col">
            <ScrollToTop />
            <Header />
            <main className="flex-1">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/place/:id" element={<PlacePage />} />
                    <Route path="/login" element={<AuthPage mode="login" />} />
                    <Route path="/register" element={<AuthPage mode="register" />} />
                    <Route path="/account" element={<RequireAuth><AccountLayout /></RequireAuth>}>
                        <Route index element={<Profile />} />
                        <Route path="bookings" element={<MyBookings />} />
                        <Route path="bookings/:id" element={<BookingDetail />} />
                        <Route path="places" element={<MyPlaces />} />
                        <Route path="places/new" element={<PlaceForm key="new" />} />
                        <Route path="places/:id" element={<PlaceForm key="edit" />} />
                    </Route>
                    <Route
                        path="*"
                        element={
                            <div className="page py-16">
                                <EmptyState title="Page not found" action={<Link to="/" className="btn-primary">Go home</Link>}>
                                    The page you’re looking for doesn’t exist.
                                </EmptyState>
                            </div>
                        }
                    />
                </Routes>
            </main>
            <Footer />
        </div>
    );
}
