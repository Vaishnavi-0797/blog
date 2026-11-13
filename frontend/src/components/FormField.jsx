import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// A label + input + error message. Password fields get a show/hide button.
export default function FormField({ label, id, error, hint, type = 'text', ...inputProps }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-wrap">
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          className={error ? 'input input-error' : 'input'}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...inputProps}
        />
        {isPassword && (
          <button type="button" className="input-toggle" onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error ? <p className="field-error" id={`${id}-error`}>{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
