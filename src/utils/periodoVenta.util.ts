/**
 * Calcula el año ISO y el número de semana ISO (formato: YYYYWW)
 * @returns {string} Cadena con el año y la semana ISO actual, ej. "202423"
 */
export function getCurrentYearWeek(): string {
  const now = new Date()
  const yearWeek = getISOYearWeek(now)
  return `${yearWeek.year}${yearWeek.week.toString().padStart(2, '0')}`
}

/**
 * Calcula el año y número de semana ISO 8601 para una fecha dada
 * @param {Date} date - La fecha para calcular la semana ISO
 * @returns {{ year: number, week: number }}
 */
function getISOYearWeek(date: Date): { year: number; week: number } {
  const target = new Date(date.valueOf())

  // Establece el día al jueves de la semana actual
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7))

  const year = target.getFullYear()

  // Primer jueves del año ISO
  const firstThursday = new Date(year, 0, 4)
  firstThursday.setDate(
    firstThursday.getDate() + 3 - ((firstThursday.getDay() + 6) % 7)
  )

  // Calcula la diferencia en días y convierte a semanas
  const week = Math.floor(
    1 + (target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)
  )

  return { year, week }
}
