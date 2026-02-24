import {AuthProvider} from './contexts/AuthContext'
import {SignUp} from "./pages/SignUp.tsx";


function App() {

  return (
      <AuthProvider>
          <SignUp/>
      </AuthProvider>
  )
}

export default App
