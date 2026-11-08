import { Request, Response, NextFunction } from "express"
import { supabase } from "../server"

// Protects host-only routes. The app sends the logged-in user's Supabase token:
//   Authorization: Bearer <access_token>
// On success, res.locals.userId is the verified user's id. Route code should always use
// that, never a user id sent in the request body.
//
// Not used on the guest RSVP routes: there the token in the invite link is the credential.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    try {
        const [scheme, token] = (req.headers.authorization ?? "").split(" ")
        if (scheme?.toLowerCase() !== "bearer" || !token)
            return res.status(401).json({ error: "Missing or malformed Authorization header" })

        // Asks Supabase Auth whether this token is valid and who it belongs to.
        // (Never call signIn... on this server client: it can change the client's session.)
        const { data, error } = await supabase.auth.getUser(token)
        if (error || !data.user)
            return res.status(401).json({ error: "Invalid or expired token" })

        res.locals.userId = data.user.id
        return next()
    } catch (err) {
        // Express 4 doesn't catch errors thrown in async functions, so catch them here
        console.error(err)
        return res.status(500).json({ error: "Could not verify login" })
    }
}