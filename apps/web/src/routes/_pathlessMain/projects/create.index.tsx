import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  Button,
} from '@workspace/ui/components'

export const Route = createFileRoute('/_pathlessMain/projects/create/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  return <div className='w-full flex justify-center items-center mt-16'>
    <FieldGroup className='max-w-[500px] w-full'>
      <FieldSet>
        <FieldLegend>Create New Project</FieldLegend>
        <FieldDescription>
          All transactions are secure and encrypted
        </FieldDescription>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="checkout-7j9-card-name-43j">
              Project Name
            </FieldLabel>
            <Input
              id="checkout-7j9-card-name-43j"
              placeholder="Evil Rabbit"
              required
            />
          </Field>
        </FieldGroup>
      </FieldSet>


      <Field orientation="horizontal">
        <Button type="submit"
          onClick={() => {
            navigate({ to: "/projects/create/application" })
          }}
        >Create</Button>
        <Button variant="outline" type="button">
          Cancel
        </Button>
      </Field>
    </FieldGroup>
  </div>
}
