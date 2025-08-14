import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import React, { useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { LogOutIcon, User } from "lucide-react"
import { userUser } from "../sidepanel/hooks/useUser"

type Props = {
  userEmail: string
}

export function SheetDemo({ userEmail }: Props) {
  const { user, getUser, loading: userLoading, error: userError } = userUser();
  
  if (!user) {
    getUser();
    return <></>
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Avatar className="cursor-pointer m-auto">
          <AvatarImage className="size-7 overflow-hidden rounded-full" src="" alt="@shadcn" />
          <AvatarFallback>
              <User className="size-7 p-1 border-[1px] border-secondary overflow-hidden rounded-full align-middle" />
          </AvatarFallback>
        </Avatar>
      </SheetTrigger>
      <SheetContent side="bottom" className="w-full max-w-sm mx-auto h-fit rounded-t-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader>
          <SheetTitle>
            <Avatar className="cursor-pointer m-auto">
              <AvatarImage className="size-7 overflow-hidden rounded-full" src="" alt="@shadcn" />
              <AvatarFallback>
                  <User className="size-7 p-1 border-[1px] border-secondary overflow-hidden rounded-full align-middle" />
              </AvatarFallback>
            </Avatar>
            <div className="text-sm font-thin text-gray-500">{userEmail}</div>
            <Button
              variant={"link"}
              onClick={()=> {
                chrome.runtime.sendMessage({ type: "closeSidePanel" });
                window.open("https://belikenative.com/dashboard/?action=logout ", "_blank")}
              }
              size={"sm"} className="text-secondary h-5"
            >
              Logout
            </Button>
          </SheetTitle>
          <SheetDescription>
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col my-3">
          <b>Usage</b>
          <div>
            <span>Daily Usage: </span>
            <span className={user?.dailyApiUsage >= user?.dailyApiLimit ? "text-red-500" : user?.dailyApiUsage >= user?.dailyApiLimit - 10 ? "text-yellow-500" : ""}>
            <span className="font-bold">{user?.dailyApiUsage}</span><span>/{user?.dailyApiLimit}</span>
            </span>
          </div>
          <div>
            <span>Monthly Usage: </span>
            <span className={user?.monthlyApiUsage >= user?.monthlyApiLimit ? "text-red-500" : user?.monthlyApiUsage >= user?.monthlyApiLimit - 10 ? "text-yellow-500" : ""}>
              <span className="font-bold">{user?.monthlyApiUsage}</span><span>/{user?.monthlyApiLimit}</span>
            </span>
          </div>
        </div>
        <SheetFooter>
          <Button onClick={()=> window.open("https://belikenative.com/dashboard/", "_blank")} size={"sm"} className="bg-secondary w-fit px-10 m-auto">Dashboard</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
