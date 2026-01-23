import { signUpAction } from "../actions";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PageProps = {
  params: { locale: string } | Promise<{ locale: string }>;
  searchParams?: { error?: string; message?: string } | Promise<{ error?: string; message?: string }>;
};

export default async function SignUpPage({ params, searchParams }: PageProps) {
  const { locale } = await Promise.resolve(params);
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const error =
    typeof resolvedSearchParams?.error === "string"
      ? resolvedSearchParams.error
      : "";
  const message =
    typeof resolvedSearchParams?.message === "string"
      ? resolvedSearchParams.message
      : "";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Join LocalPath and start exploring with locals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {message}
          </div>
        ) : null}
        <form action={signUpAction} className="space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <input
            type="hidden"
            name="redirectTo"
            value={`/${locale}`}
          />
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">Profile image URL (optional)</Label>
            <Input
              id="avatarUrl"
              name="avatarUrl"
              type="url"
              autoComplete="url"
              placeholder="https://example.com/avatar.png"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-muted-foreground">
        <span>
          Already have an account?{" "}
          <Link href="/auth/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}
