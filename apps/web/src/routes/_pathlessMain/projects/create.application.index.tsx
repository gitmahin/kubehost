import { createFileRoute } from '@tanstack/react-router'
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

export const Route = createFileRoute(
  '/_pathlessMain/projects/create/application/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='w-full flex justify-center items-center mt-16 pb-20'>
      <FieldGroup className='max-w-[500px] w-full'>
        <FieldSet>
          <FieldLegend>Deploy New Application</FieldLegend>
          <FieldDescription>
            All transactions are secure and encrypted
          </FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="image">
                Image
              </FieldLabel>
              <Input
                id="image"
                placeholder="nginx:latest"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="container-name">
                Container Name
              </FieldLabel>
              <Input
                id="container-name"
                placeholder="my-app-container"
                required
              />
            </Field>

            <Field orientation="horizontal">
              <Field>
                <FieldLabel htmlFor="container-port">
                  Container Port
                </FieldLabel>
                <Input
                  id="container-port"
                  type="number"
                  placeholder="8080"
                  min={0}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') e.preventDefault()
                  }}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="port-binding">
                  Port Binding
                </FieldLabel>
                <Input
                  id="port-binding"
                  type="number"
                  placeholder="80"
                  min={0}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') e.preventDefault()
                  }}
                  required
                />
              </Field>
            </Field>

            <Field>
              <FieldLabel htmlFor="replicas">
                Replicas
              </FieldLabel>
              <Input
                id="replicas"
                type="number"
                placeholder="1"
                min={1}
                required
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSeparator />

        <FieldSet>
          <FieldLegend>Host</FieldLegend>
          <FieldDescription>
            Configure how this application is exposed
          </FieldDescription>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="host">
                Host
              </FieldLabel>
              <Input
                id="host"
                placeholder="app.example.com"
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="path">
                Path <span className="text-muted-foreground">(optional)</span>
              </FieldLabel>
              <Input
                id="path"
                placeholder="/"
              />
            </Field>
          </FieldGroup>
        </FieldSet>

        <Field orientation="horizontal">
          <Button type="submit">Deploy</Button>
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </Field>
      </FieldGroup>
    </div>
  )
}