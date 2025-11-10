import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Supplier from './pages/Supplier'
import Categories from "./pages/Categories";
import Products from "./pages/Products";
// Placeholder page components (create these next or use empty divs for now)
function Dashboard() {
  return <div className="text-2xl font-bold">Dashboard Page</div>;
}

// function Products() {
//   return <div className="text-2xl font-bold">Products Page</div>;
// }

// function Categories() {
//   return <div className="text-2xl font-bold">Categories Page</div>;
// }

// function Suppliers() {
//   return <div className="text-2xl font-bold">Suppliers Page</div>;
// }

function Inventory() {
  return <div className="text-2xl font-bold">Inventory Page</div>;
}

function Sales() {
  return <div className="text-2xl font-bold">Sales Page</div>;
}

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