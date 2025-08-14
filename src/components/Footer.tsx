
import React from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { MessageCircleIcon, Users } from 'lucide-react'
import { Button } from './ui/button'

type Props = {}

const Footer = (props: Props) => {
  return (
    <div className="w-full mt-3 flex justify-between items-center">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href="https://belikenative.com/contact/" target="_blank">
                <Button className="size-7 p-2" variant={"outline"} size={"sm"}>
                  <MessageCircleIcon className="size-5" />
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                Give feedback or report a bug
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div>
          <div className="w-full text-[8px] text-gray-400 text-center">
            Sharing the ❤️ of Language with Non-Native Speakers
          </div>
          <div className="w-full flex justify-center items-center">
            <a href="https://belikenative.com/privacy" target="_blank">
              <div className="text-[7px] text-gray-400">Privacy Policy</div>
            </a>
            <div className="text-[7px] text-gray-400 mx-1">|</div>
            <a href="https://belikenative.com/terms" target="_blank">
              <div className="text-[7px] text-gray-400">Terms of Service</div>
            </a>
          </div>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <a href="https://belikenative.com/community/" target="_blank">
                <Button className="size-7 p-2" variant={"outline"} size={"sm"}>
                  <Users className="size-5" />
                </Button>
              </a>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                Join our community
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
  )
}

export default Footer