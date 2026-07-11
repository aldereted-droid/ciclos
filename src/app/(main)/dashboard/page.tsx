import { redirect } from 'next/navigation'

// La lista de ciclos YA es el panel principal. Un dashboard aparte solo duplicaria
// la misma informacion, asi que esta ruta (heredada del scaffolding) redirige.
export default function DashboardPage() {
  redirect('/cycles')
}
