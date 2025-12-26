import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Supplier from './pages/Supplier'
import Categories from "./pages/Categories";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Sales from "./pages/Sale";
import Dashboard from "./pages/Dashboard";
// Placeholder page components (create these next or use empty divs for now)
// function Dashboard() {
//   return <div className="text-2xl font-bold">Dashboard Page</div>;
// }
function NotFound() {
  return <div className="text-2xl font-bold text-red-600">404 - Page Not Found</div>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="categories" element={<Categories />} />
          <Route path="suppliers" element={<Supplier />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="sales" element={<Sales />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;