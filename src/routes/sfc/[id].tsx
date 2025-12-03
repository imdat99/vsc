import { Context } from "hono";
// export default createRoute((c) => {
//     const name = c.req.query("name") ?? "Hono";
//     return c.render(defineComponent({
//         name: "HelloComponent",
//         setup() {
//         return () => <div>HelloComponent, {name}!</div>;
//         },
//     }));
// });
const ImagePage = (context: Context) => {
  console.log(context);
  return (
    <div>
      <h1>Image Page</h1>
      <img src="https://via.placeholder.com/300" alt="Placeholder Image" />
    </div>
  )
}

export default ImagePage