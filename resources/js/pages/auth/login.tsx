import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';

type Props = {
    status?: string;
};

const fieldClass =
    'h-11 rounded-xl text-base sm:text-sm focus-visible:border-orange-500 focus-visible:ring-orange-500/25';

export default function Login({ status }: Props) {
    return (
        <>
            <Head title="Masuk" />

            {status && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-center text-sm font-medium text-green-700">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="email"
                                placeholder="nama@email.com"
                                className={fieldClass}
                            />
                            <InputError message={errors.email} />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                placeholder="Masukkan password"
                                className={fieldClass}
                            />
                            <InputError message={errors.password} />
                            <p className="text-xs text-slate-500">
                                Lupa password? Hubungi administrator sistem.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="remember"
                                name="remember"
                                tabIndex={3}
                                className="data-[state=checked]:border-orange-500 data-[state=checked]:bg-orange-500"
                            />
                            <Label htmlFor="remember" className="font-normal">
                                Ingat saya
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                            className="mt-2 h-12 w-full rounded-full bg-gradient-to-r from-[#f97316] to-[#ea580c] text-base font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:from-[#ea580c] hover:to-[#c2410c] sm:text-sm"
                        >
                            {processing && <Spinner />}
                            Masuk
                        </Button>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Masuk ke akun Anda',
    description: 'Gunakan email dan password yang diberikan administrator.',
};