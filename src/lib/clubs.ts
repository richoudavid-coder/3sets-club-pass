import type { Sport } from '../types'

// Source de vérité côté frontend pour les clubs partenaires.
// Doit rester synchronisé avec les données insérées dans supabase/schema.sql
export interface ClubSeed {
  slug: string
  name: string
  sport: Sport
}

export const CLUBS_SEED: ClubSeed[] = [
  { slug: 'tc-brestois', name: 'Tennis Club Brestois', sport: 'tennis' },
  { slug: 'tc-relecq-kerhuon', name: 'Tennis Club du Relecq Kerhuon', sport: 'tennis' },
  { slug: 'badminton-milizac', name: 'Badminton Milizac', sport: 'badminton' },
  { slug: 'badminton-lannilis', name: 'Badminton Club de Lannilis', sport: 'badminton' },
  { slug: 'tie-break-guilers', name: 'Tie Break à Guilers', sport: 'padel' },
  { slug: 'tt-guipavas', name: 'TT Guipavas', sport: 'tennis-de-table' },
  { slug: 'tt-des-abers', name: 'TT des Abers', sport: 'tennis-de-table' },
  { slug: 'tt-loperhet', name: 'TT Loperhet', sport: 'tennis-de-table' },
]
