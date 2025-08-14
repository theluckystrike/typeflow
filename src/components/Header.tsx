
import React from 'react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { SheetDemo } from './Sheet'
import { User } from '../types/types'

type Props = {
    user: User | undefined;
}

const Header = ({ user }: Props) => {
  return (
    <div className="w-full flex justify-between items-center">
        <div className="w-fit flex items-center">
          <div className="w-24 relative -left-1">
            <a href="https://belikenative.com" target="_blank">
              <img alt="belikenative" src="/heading.svg" />
            </a>
          </div>
          <div>
            {user?.subscriptionDetails === null && <Badge className="px-2 py-1" variant={"outline"}>Free</Badge>}
          </div>
        </div>
        <div className="flex gap-1 items-center">
          {user?.email.length !== 0 && (
            <div className="flex gap-1 items-center">
              {user?.subscriptionDetails === null && <Button onClick={() => window.open("https://belikenative.com/#pricing", "_blank")} variant={"default"} size={"sm"} className='bg-secondary'>Go Premium</Button>}
              <SheetDemo userEmail={user?.email ?? ""}/>
            </div>
          )}
          {user?.email?.length === 0 && (
            <Button onClick={() => window.open("https://belikenative.com/login", "_blank")} variant={"default"} size={"sm"}>Login</Button>
          )}
        </div>
      </div>
  )
}

export default Header