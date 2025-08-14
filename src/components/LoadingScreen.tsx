
import React from 'react'
import { LoadingProgress } from './Progress';
import { Button } from './ui/button';
import Footer from './Footer';

type Props = {
    userLoading: boolean;
    userError: boolean;
}

const LoadingScreen = ({ userLoading, userError }: Props) => {
  return (
    <div className="w-[100%] h-screen p-5 flex flex-col justify-center items-center">
        <div className="flex h-[100%] flex-col justify-center items-center py-5">
          <img className="" width={150} src="/owl-login.svg" alt="logo" />
          <img className="" width={200} src="/heading.svg" alt="logo" />
          <div className='h-5'>
            {userLoading && (
              <div className="w-full flex flex-col items-center">
                <div className="text-gray-400">Loading...</div>
                <LoadingProgress speed={30}/>
              </div>
            )}
            {userError && (
              <div className="flex flex-col w-35 gap-1">
                <Button onClick={async () => {
                  chrome.runtime.sendMessage({ type: "closeSidePanel" });
                  window.open("https://belikenative.com/login", "_blank");
                }
                  } variant={"default"} size={"sm"} className='w-fit m-auto px-10'>Login</Button>
                <div className="text-gray-400 mt-1">
                  Please login to start using the extension
                </div>
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
  )
}

export default LoadingScreen