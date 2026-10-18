import { Navigate, Outlet, useLocation } from "react-router-dom";
import { getToken } from "../../utils/auth";

// No token -> /login (remembering where the user was going).
// Because children are only rendered when signed in, hooks inside them never
// fire a request for a signed-out visitor.
//
// Two ways to use it:
//   <RequireAuth><SitesContent /></RequireAuth>        // wrap one page
//   <Route element={<RequireAuth />}> ...routes... </Route>   // guard many routes at once
export default function RequireAuth({ children }) {
  const location = useLocation();
  if (!getToken()) return <Navigate to="/login" replace state={{ from: location }} />;
  return children ?? <Outlet />;
}
