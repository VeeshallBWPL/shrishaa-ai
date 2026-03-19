export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your AI pipeline and integrations</p>
      </div>

      <div className="space-y-4">
        {/* Generation settings */}
        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Generation</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Posts per run
              </label>
              <input
                type="number"
                defaultValue={3}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Schedule (cron)
              </label>
              <input
                type="text"
                defaultValue="0 6 * * *"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Runs daily at 6:00 AM</p>
            </div>
          </div>
        </section>

        {/* Supabase */}
        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Supabase</h2>
          <p className="text-xs text-gray-400 mb-4">Set via environment variables</p>
          <div className="space-y-3">
            {[
              { label: 'Supabase URL', env: 'NEXT_PUBLIC_SUPABASE_URL' },
              { label: 'Anon Key', env: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' },
            ].map(({ label, env }) => (
              <div key={env}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  <code className="text-xs text-gray-500 flex-1">{env}</code>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">ENV</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Instagram */}
        <section className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Instagram</h2>
              <p className="text-xs text-gray-400 mt-0.5">Connect your Instagram account</p>
            </div>
            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
              Not connected
            </span>
          </div>
          <button className="px-4 py-2 border border-gray-200 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Connect Instagram
          </button>
        </section>

        {/* Save */}
        <div className="flex justify-end">
          <button className="px-5 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
