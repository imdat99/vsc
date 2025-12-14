import type { Context } from "hono"
import { inject } from "vue"
import { requestCtxKey } from "../constants"

export const useRequestContext = () => {
    // only works on server side
    const ctx = inject<Context>(requestCtxKey)
    return ctx
}
