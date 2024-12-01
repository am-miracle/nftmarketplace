"use client"
import React from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import Image from 'next/image'
import Envelope from "../assets/Envelope.svg"
import { useForm } from 'react-hook-form'
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormField, FormItem } from './ui/form'

const formSchema = z.object({
    email: z.string().email(),
})

const SubscribeButton = () => {
  const form = useForm<z.infer<typeof formSchema>>({
      resolver: zodResolver(formSchema),
      defaultValues: {
          email: '',
      },
  })

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        console.log(values)
    }
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem className='flex flex-col gap-2 lg:gap-0 md:bg-white md:rounded-[20px] md:flex-row md:items-center lg:h-[60px] space-y-0'>
                        <Input className="bg-white rounded-[20px] text-black md:border-0 md:w-1/2 lg:h-[60px] placeholder:md:text-sm" placeholder='Enter your email here' {...field} />
                        <Button type='submit' className='bg-accent text-white rounded-[20px] flex items-center hover:scale-95 md:w-1/2 lg:h-[60px] font-bold'>
                            <Image src={Envelope} alt="Subscribe" width={100} height={100} className='h-5 w-5' style={{width: "auto", height: "auto"}} />
                            <p>Subscribe</p>
                        </Button>
                    </FormItem>
                )
            }
            />
        </form>
      </Form>
  )
}

export default SubscribeButton