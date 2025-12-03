import type { NotFoundHandler } from 'hono'

const handler: NotFoundHandler = (c) => {
  c.status(404)
  return c.render(<div>Not Found</div>)
}

export default handler
