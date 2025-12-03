import { createRoute } from 'honox/factory'
import "hono/jsx/dom"
import "@vue/runtime-dom"
// export default createRoute((c) => {
//   const name = c.req.query('name') ?? 'Hono'
//   return c.json({ message: `Hello, ${name}!` })
// })

// import { defineComponent } from "vue";
import HomeServer from "./home.server.vue";
export default createRoute((c) => {
    const name = c.req.query("name") ?? "Hono";
    return c.render(<HomeServer /> as any);
});