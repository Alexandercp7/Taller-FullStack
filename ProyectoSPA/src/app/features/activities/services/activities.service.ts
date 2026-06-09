import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import type { Activity, Comment } from '../models/activity.model';

interface ActivityApi {
  id: number;
  titulo: string;
  descripcion: string;
  estado: string;
  prioridad: string;
  etiqueta: string;
  fecha_limite: string;
  asignado_a: { id: number; name: string } | null;
  comentarios: CommentApi[] | null;
  created_at: string;
}

interface CommentApi {
  id: number;
  texto: string;
  user?: { name: string };
  usuario_id?: number;
  created_at: string;
}

interface Paginated<T> { data: T[] }

@Injectable({ providedIn: 'root' })
export class ActivitiesService {
  private readonly _http = inject(HttpClient);
  private readonly _activities = signal<Activity[]>([]);

  constructor() { this.loadAll(); }

  private loadAll(): void {
    this._http.get<Paginated<ActivityApi>>('/api/v1/activities?per_page=100').subscribe({
      next: (res) => this._activities.set(res.data.map(this.map)),
    });
  }

  private map(item: ActivityApi): Activity {
    return {
      id: String(item.id),
      titulo: item.titulo,
      descripcion: item.descripcion,
      asignadoA: item.asignado_a?.name ?? '',
      fechaLimite: item.fecha_limite,
      prioridad: item.prioridad as Activity['prioridad'],
      etiqueta: item.etiqueta,
      estado: item.estado as Activity['estado'],
      comentarios: (item.comentarios ?? []).map(c => ({
        id: String(c.id),
        usuario: c.user?.name ?? 'Sistema',
        texto: c.texto,
        timestamp: c.created_at,
      })),
    };
  }

  getActivities() { return this._activities(); }

  getActivityById(id: string): Activity | undefined {
    return this._activities().find(a => a.id === id);
  }

  addActivity(activity: Activity) {
    const body = {
      titulo: activity.titulo,
      descripcion: activity.descripcion,
      prioridad: activity.prioridad,
      etiqueta: activity.etiqueta,
      fecha_limite: activity.fechaLimite,
      estado: activity.estado,
    };
    this._http.post<{ data: ActivityApi }>('/api/v1/activities', body).subscribe({
      next: (res) => this._activities.update(list => [...list, this.map(res.data)]),
    });
  }

  updateActivity(id: string, update: Partial<Activity>) {
    this._activities.update(list => list.map(a => a.id === id ? { ...a, ...update } : a));
    const body: Record<string, unknown> = {};
    if (update.titulo !== undefined) body['titulo'] = update.titulo;
    if (update.descripcion !== undefined) body['descripcion'] = update.descripcion;
    if (update.prioridad !== undefined) body['prioridad'] = update.prioridad;
    if (update.etiqueta !== undefined) body['etiqueta'] = update.etiqueta;
    if (update.fechaLimite !== undefined) body['fecha_limite'] = update.fechaLimite;
    if (update.estado !== undefined) body['estado'] = update.estado;
    this._http.put(`/api/v1/activities/${id}`, body).subscribe();
  }

  deleteActivity(id: string) {
    this._activities.update(list => list.filter(a => a.id !== id));
    this._http.delete(`/api/v1/activities/${id}`).subscribe();
  }

  addComment(activityId: string, comment: Comment) {
    this._activities.update(list =>
      list.map(a => a.id === activityId ? { ...a, comentarios: [...a.comentarios, comment] } : a)
    );
    this._http.post(`/api/v1/activities/${activityId}/comments`, { texto: comment.texto }).subscribe();
  }

  deleteComment(activityId: string, commentId: string) {
    this._activities.update(list =>
      list.map(a => a.id === activityId
        ? { ...a, comentarios: a.comentarios.filter(c => c.id !== commentId) }
        : a
      )
    );
  }

  generateActivityWithId(activity: Omit<Activity, 'id' | 'comentarios'>): Activity {
    return { ...activity, id: `ACT-${Date.now().toString().slice(-6)}`, comentarios: [] };
  }

  generateCommentWithId(texto: string, usuario: string): Comment {
    return { id: `COM-${Date.now()}`, usuario, texto, timestamp: new Date().toISOString() };
  }
}
