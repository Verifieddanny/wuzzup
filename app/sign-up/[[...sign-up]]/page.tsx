import { SignUp } from '@clerk/nextjs'

export default function Page() {
  return (<div className='w-full h-full bg-white flex justify-center items-center'>
    <SignUp />
  </div> )
}