
export type Product = {
  id: number;
  name: string;
  category: "Ropa" | "Bolsos";
  collection: "Mujer" | "Hombre" | "Tallas grandes" | "Bolsos";
  price: number;
  oldPrice?: number;
  image: string;
  tag?: "NUEVO" | "OFERTA" | "TRENDING";
  description: string;
};

export const products: Product[] = [
 
  {
    id: 1,
    name: "Vestido Lila Dream",
    category: "Ropa",
    collection: "Mujer",
    price: 29.99,
    oldPrice: 45.99,
    image:
      "https://images.pexels.com/photos/39030829/pexels-photo-39030829.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    tag: "OFERTA",
    description: "Vestido ligero en tono lila con corte fluido, perfecto para días de sol.",
  },
  {
    id: 2,
    name: "Bolso Morado Elegance",
    category: "Bolsos",
    collection: "Bolsos",
    price: 34.99,
    image:
      "https://images.pexels.com/photos/18101857/pexels-photo-18101857.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    tag: "TRENDING",
    description: "Bolso de cuero sintético con acabado morado y detalle dorado.",
  },
  {
    id: 3,
    name: "Sudadera Urban Hoodie",
    category: "Ropa",
    collection: "Hombre",
    price: 39.99,
    image:
      "https://images.pexels.com/photos/28701960/pexels-photo-28701960.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    tag: "NUEVO",
    description: "Hoodie oversize de algodón para un look streetwear cómodo y moderno.",
  },
  {
    id: 4,
    name: "Bolso Mini Crossbody",
    category: "Bolsos",
    collection: "Bolsos",
    price: 24.99,
    oldPrice: 39.99,
    image:
      "https://images.pexels.com/photos/16297802/pexels-photo-16297802.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    tag: "OFERTA",
    description: "Bolso cruzado compacto, ideal para llevar lo esencial con estilo.",
  },
  {
    id: 5,
    name: "Camiseta Purple Life",
    category: "Ropa",
    collection: "Mujer",
    price: 19.99,
    image:
      "https://images.pexels.com/photos/14798947/pexels-photo-14798947.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    tag: "NUEVO",
    description: "Camiseta de algón en morado intenso con estampado minimalista.",
  },
  {
    id: 6,
    name: "Tote Bag Lavanda",
    category: "Bolsos",
    collection: "Bolsos",
    price: 27.99,
    image:
      "https://images.pexels.com/photos/36365228/pexels-photo-36365228.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "Tote bag de cuero con estructura rígida y diseño minimalista.",
  },
  {
    id: 7,
    name: "Jeans Denim Classic",
    category: "Ropa",
    collection: "Mujer",
    price: 32.99,
    image:
      "https://images.pexels.com/photos/10133274/pexels-photo-10133274.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "Jeans de corte slim en denim azul clásico, versátiles para cualquier look.",
  },
  
  {
    id: 9,
    name: "Mochila Urban Purple",
    category: "Bolsos",
    collection: "Bolsos",
    price: 36.99,
    image:
      "https://images.pexels.com/photos/12397140/pexels-photo-12397140.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    tag: "TRENDING",
    description: "Mochila acolchada con detalles en color, ideal para el día a día.",
  },
  {
    id: 10,
    name: "Vestido Royal Gown",
    category: "Ropa",
    collection: "Mujer",
    price: 42.99,
    image:
      "https://images.pexels.com/photos/32982262/pexels-photo-32982262.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    description: "Vestido largo en morado real con corte elegante para ocasiones especiales.",
  },
  {
    id: 11,
    name: "Hoodie Duo Street",
    category: "Ropa",
    collection: "Hombre",
    price: 44.99,
    image:
      "https://images.pexels.com/photos/19461581/pexels-photo-19461581.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
    tag: "NUEVO",
    description: "Pack de dos hoodies streetwear en colores combinables.",
  },
  {
    id: 13,
    name: "Bolso",
    category: "Bolsos",
    collection: "Bolsos",
    price: 25,
    image: "/productos/bolso.jpg",
    tag: "NUEVO",
    description: "Bolso nuevo de KIGOBESHOP.",
  },
  {
    id: 14,
    name: "Conjunto",
    category: "Ropa",
    collection: "Mujer",
    price: 35,
    image: "/productos/conjunto.jpg",
    tag: "NUEVO",
    description: "Conjunto de ropa nuevo de KIGOBESHOP.",
  },
];

export const categories = [
  { name: "Todos", icon: "✨" },
  { name: "Ropa", icon: "👗" },
  { name: "Bolsos", icon: "👜" },
];
