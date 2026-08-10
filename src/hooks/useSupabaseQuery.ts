import { useEffect, useState, useCallback } from 'react'

export function useSupabaseQuery<T>(
  queryFn: () => Promise<T>,
  dependencies: any[] = [],
  options: { enabled?: boolean } = { enabled: true }
) {
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(options.enabled)

  const fetchData = useCallback(async () => {
    if (options.enabled === false) return
    setIsLoading(true)
    try {
      const result = await queryFn()
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, options.enabled])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, error, isLoading, refetch: fetchData }
}
