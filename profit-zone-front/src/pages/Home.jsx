import Button from '../components/atoms/Button/Button.jsx'
import ApiStatus from '../components/molecules/ApiStatus/ApiStatus.jsx'

function Home() {
  return (
    <section>
      <h1>Bienvenido a ProfitZone</h1>
      <p>Estructura base del proyecto lista para empezar a desarrollar.</p>
      <div>
        <Button to="/analizar/rubro">Comenzar análisis</Button>
      </div>
      <ApiStatus />
    </section>
  )
}

export default Home
