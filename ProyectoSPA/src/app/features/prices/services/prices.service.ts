import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type { PriceFilter, Servicio, ServicioAutomotriz, ServicioTorno } from '../models/price.model';

interface PriceItemApi {
  id: number;
  categoria_principal: string;
  sistema: string | null;
  familia: string | null;
  concepto: string | null;
  tamano: string | null;
  diametro: string | null;
  precio_auto: string | null;
  precio_camioneta: string | null;
  precio_camion: string | null;
  precio: string | null;
  activo: boolean;
}

interface Paginated<T> { data: T[] }

@Injectable({ providedIn: 'root' })
export class PricesService {
  private readonly _http = inject(HttpClient);
  private readonly _servicios = signal<Servicio[]>([]);

  constructor() { this.loadAll(); }

  private loadAll(): void {
    this._http.get<Paginated<PriceItemApi>>('/api/v1/prices?per_page=500').subscribe({
      next: (res) => this._servicios.set(res.data.map(this.map)),
    });
  }

  private map(item: PriceItemApi): Servicio {
    if (item.categoria_principal === 'Servicio de Torno') {
      return {
        id: item.id,
        categoriaPrincipal: 'Servicio de Torno',
        tamano: item.tamano ?? '',
        diametro: item.diametro ?? '',
        precio: item.precio ?? '',
      } satisfies ServicioTorno;
    }
    return {
      id: item.id,
      categoriaPrincipal: item.categoria_principal as ServicioAutomotriz['categoriaPrincipal'],
      sistema: item.sistema ?? '',
      familia: item.familia ?? '',
      concepto: item.concepto ?? '',
      precioAuto: item.precio_auto ?? '',
      precioCamioneta: item.precio_camioneta ?? '',
      precioCamion: item.precio_camion ?? '',
      observacion: '',
    } satisfies ServicioAutomotriz;
  }

  getServicios() { return this._servicios(); }

  getServicioById(id: number): Servicio | undefined {
    return this._servicios().find(s => s.id === id);
  }

  addServicio(servicio: Servicio) {
    const body = this.toBody(servicio);
    this._http.post<{ data: PriceItemApi }>('/api/v1/prices', body).subscribe({
      next: (res) => this._servicios.update(list => [...list, this.map(res.data)]),
    });
  }

  updateServicio(id: number, update: Partial<Servicio>) {
    const current = this._servicios().find(s => s.id === id);
    if (!current) return;
    const merged = { ...current, ...update } as Servicio;
    const body = this.toBody(merged);
    this._http.put<{ data: PriceItemApi }>(`/api/v1/prices/${id}`, body).subscribe({
      next: (res) => this._servicios.update(list => list.map(s => s.id === id ? this.map(res.data) : s)),
    });
  }

  deleteServicio(id: number) {
    this._servicios.update(list => list.filter(s => s.id !== id));
  }

  filterServicios(filter: PriceFilter): { items: Servicio[]; total: number } {
    let filtered = [...this._servicios()];

    if (filter.categoriaPrincipal && filter.categoriaPrincipal !== 'Todas') {
      filtered = filtered.filter(s => s.categoriaPrincipal === filter.categoriaPrincipal);
    }
    if (filter.sistema) {
      filtered = filtered.filter(s => 'sistema' in s && (s as ServicioAutomotriz).sistema === filter.sistema);
    }
    if (filter.familia) {
      filtered = filtered.filter(s => 'familia' in s && (s as ServicioAutomotriz).familia === filter.familia);
    }
    if (filter.searchText) {
      const q = filter.searchText.toLowerCase().trim();
      filtered = filtered.filter(s => {
        if ('concepto' in s) return (s as ServicioAutomotriz).concepto.toLowerCase().includes(q);
        if ('tamano' in s) {
          const t = s as ServicioTorno;
          return t.tamano.toLowerCase().includes(q) || t.diametro.toLowerCase().includes(q);
        }
        return false;
      });
    }

    const pageSize = filter.pageSize || 10;
    const start = (filter.pageNumber || 0) * pageSize;
    return { items: filtered.slice(start, start + pageSize), total: filtered.length };
  }

  getCategoriaPrincipal(): string[] {
    return ['Todas', 'Afinación y Otros', 'Mecánica Rápida', 'Mecánica General', 'Servicio de Torno'];
  }

  getSistemasPorCategoria(categoria: string): string[] {
    if (!categoria || categoria === 'Todas') return [];
    const sistemas = new Set(
      (this._servicios().filter(s => s.categoriaPrincipal === categoria) as ServicioAutomotriz[])
        .map(s => s.sistema).filter(Boolean)
    );
    return Array.from(sistemas).sort();
  }

  getFamiliasPorSistema(categoria: string, sistema?: string): string[] {
    let servicios = this._servicios().filter(s => s.categoriaPrincipal === categoria) as ServicioAutomotriz[];
    if (sistema) servicios = servicios.filter(s => s.sistema === sistema);
    const familias = new Set(servicios.map(s => s.familia).filter(Boolean));
    return Array.from(familias).sort();
  }

  isTorno(servicio: Servicio): boolean { return servicio.categoriaPrincipal === 'Servicio de Torno'; }

  parsePrice(priceStr: string): number { return parseFloat(priceStr.replace(/[$,]/g, '')); }
  formatPrice(price: number): string { return `$${price.toFixed(2)}`; }

  getSistemas(categoria: string): string[] { return this.getSistemasPorCategoria(categoria); }
  getFamilias(categoria: string, sistema?: string): string[] { return this.getFamiliasPorSistema(categoria, sistema); }

  private toBody(s: Servicio) {
    if (s.categoriaPrincipal === 'Servicio de Torno') {
      const t = s as ServicioTorno;
      return {
        categoria: 'torno',
        categoria_principal: t.categoriaPrincipal,
        concepto: `${t.tamano} - ${t.diametro}`,
        tamano: t.tamano, diametro: t.diametro, precio: t.precio,
      };
    }
    const a = s as ServicioAutomotriz;
    return {
      categoria: 'automotriz',
      categoria_principal: a.categoriaPrincipal,
      sistema: a.sistema, familia: a.familia, concepto: a.concepto,
      precio_auto: a.precioAuto, precio_camioneta: a.precioCamioneta, precio_camion: a.precioCamion,
    };
  }
}
