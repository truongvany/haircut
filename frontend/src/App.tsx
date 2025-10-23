import Login from "./pages/login";
import ServiceCreate from "./pages/ServiceCreate";

export default function App() {
  return (
    <div style={{padding:24}}>
      <h1>Haircut FE (dev)</h1>
      <Login />
      <ServiceCreate />
    </div>
  );
}
