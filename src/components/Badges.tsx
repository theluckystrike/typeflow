
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { keyMappings } from '../constants/options'

type Props = {
    shortucts: string
}

const Badges = ({ shortucts }: Props) => {
    return (
        <div className='w-full flex justify-between items-center'>
            {
                shortucts.split("+").map((shortcut, index) => (
                    <Badge variant={'secondary'} key={index} className="mr-1 text-[9px] px-3">{shortcut in keyMappings ? keyMappings[shortcut] : shortcut.toUpperCase()}</Badge>
                ))
            }
        </div>
    )
}

export default Badges