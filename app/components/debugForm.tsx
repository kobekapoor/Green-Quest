import { useFormContext } from 'remix-validated-form'

export const DebugForm = () => {
  const context = useFormContext()
  return (
    <>
      <pre>{JSON.stringify(context, null, 2)}</pre>
      <pre>{JSON.stringify(context.getValues(), null, 2)}</pre>
    </>
  )
}
