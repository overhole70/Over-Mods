import { useEffect, useState } from "react";
import { getAuth, applyActionCode } from "firebase/auth";

export default function VerifyEmailView() {
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const auth = getAuth();
    const params = new URLSearchParams(window.location.search);
    const oobCode = params.get("oobCode");

    if (!oobCode) {
      setStatus("error");
      return;
    }

    applyActionCode(auth, oobCode)
      .then(() => {
        setStatus("success");
      })
      .catch(() => {
        setStatus("error");
      });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      {status === "loading" && <p className="text-xl text-zinc-400">جارٍ تأكيد بريدك...</p>}
      {status === "success" && <p className="text-xl text-lime-500 font-bold">تم تأكيد البريد بنجاح 🎉</p>}
      {status === "error" && <p className="text-xl text-red-500 font-bold">الرابط غير صالح أو منتهي ❌</p>}
    </div>
  );
}
