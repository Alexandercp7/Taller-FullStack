import { createId } from '../../shared/identifier';

export interface ActivityComment {
  id: string;
  texto: string;
  usuario: string;
  timestamp: string;
}

export interface Activity {
  id: string;
  titulo: string;
  descripcion: string;
  estado: 'Pendiente' | 'En Proceso' | 'Completada' | 'Cancelada';
  prioridad: 'Baja' | 'Normal' | 'Alta';
  etiqueta: string;
  fechaLimite?: string;
  asignadoA?: string;
  comentarios: ActivityComment[];
}

export class InMemoryActivityService {
  private activities: Activity[] = [];

  list(): Activity[] { return [...this.activities]; }

  getById(id: string): Activity | null { return this.activities.find(a => a.id === id) ?? null; }

  create(input: Omit<Activity, 'id' | 'comentarios'>): Activity {
    const act: Activity = { ...input, id: createId(), comentarios: [] };
    this.activities.push(act);
    return act;
  }

  update(id: string, updates: Partial<Omit<Activity, 'id' | 'comentarios'>>): Activity | null {
    const idx = this.activities.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.activities[idx] = { ...this.activities[idx], ...updates };
    return this.activities[idx];
  }

  delete(id: string): boolean {
    const len = this.activities.length;
    this.activities = this.activities.filter(a => a.id !== id);
    return this.activities.length < len;
  }

  addComment(activityId: string, texto: string, usuario: string): ActivityComment | null {
    const act = this.activities.find(a => a.id === activityId);
    if (!act) return null;
    const comment: ActivityComment = {
      id: createId(),
      texto,
      usuario,
      timestamp: new Date().toISOString(),
    };
    act.comentarios.push(comment);
    return comment;
  }

  deleteComment(activityId: string, commentId: string): boolean {
    const act = this.activities.find(a => a.id === activityId);
    if (!act) return false;
    const len = act.comentarios.length;
    act.comentarios = act.comentarios.filter(c => c.id !== commentId);
    return act.comentarios.length < len;
  }
}
