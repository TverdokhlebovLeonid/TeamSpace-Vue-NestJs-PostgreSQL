export const getDataFromStorage = <T>(key: string): T | null => {
  try {
    if (localStorage && key) {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      return JSON.parse(raw) as T
    }
    return null
  } catch (error) {
    console.warn('Error getting data from localStorage', error)
    return null
  }
}
export const saveDataInStorage = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.warn('Error saving data in localStorage', error)
  }
}
export const removeDataFromStorage = (key: string) => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Error removing data from localStorage', error)
  }
}
