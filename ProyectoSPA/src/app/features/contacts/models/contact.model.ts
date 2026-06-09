export interface CreditConditions {
  diasPago: number;
  limiteCredito: number;
  politicaDescuentos: string;
}

export interface Product {
  id: string;
  nombre: string;
  cantidad?: number;
}

export interface Contact {
  id: string;
  nombre: string;
  rfc: string;
  telefono: string;
  correo: string;
  empresa: string;
  condicionesDeCreditoL: CreditConditions;
  productosQueSurten: Product[];
  etiquetas: string[];
}
