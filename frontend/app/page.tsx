import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background font-sans text-foreground p-8 gap-8">

      <div className="flex flex-col items-center text-center max-w-2xl gap-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground underline underline-offset-8 decoration-primary/30">
          Welcome to Perks Studio
        </h1>
        <p className="text-lg text-muted-foreground">
          This page utilizes various <Badge variant="secondary">shadcn/ui</Badge> components to test the global CSS variables.
        </p>
        <div className="flex gap-4 mt-2">
          <Link href="/login">
            <Button variant="default">Login</Button>
          </Link>
          <Link href="/register">
            <Button variant="outline">Register</Button>
          </Link>
        </div>
      </div>

      <Separator className="max-w-3xl" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* Buttons Test */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons & Interactions</CardTitle>
            <CardDescription>Testing all button variants using theme colors.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link Style</Button>
          </CardContent>
        </Card>

        {/* Form Inputs Test */}
        <Card>
          <CardHeader>
            <CardTitle>Input Fields</CardTitle>
            <CardDescription>Testing input fields with border, ring, and placeholder values.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email Address
              </label>
              <Input id="email" type="email" placeholder="m@example.com" />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Password
              </label>
              <Input id="password" type="password" />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full">Submit</Button>
          </CardFooter>
        </Card>

        {/* Badges Test */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Badges Reference</CardTitle>
            <CardDescription>Testing different badge variants.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-row gap-4">
            <Badge variant="default">Default Badge</Badge>
            <Badge variant="secondary">Secondary Badge</Badge>
            <Badge variant="destructive">Destructive Badge</Badge>
            <Badge variant="outline">Outline Badge</Badge>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
