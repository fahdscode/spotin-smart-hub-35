-- Create RPC function for clients to place orders securely
create or replace function public.create_client_order(
  p_client_id uuid,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client_exists boolean;
  v_item jsonb;
  v_inserted_ids uuid[] := '{}';
  v_inserted_id uuid;
begin
  -- Check if client exists and is active
  select exists (
    select 1 from clients 
    where id = p_client_id 
    and is_active = true
  ) into v_client_exists;
  
  if not v_client_exists then
    return jsonb_build_object(
      'success', false,
      'message', 'Client not found or inactive'
    );
  end if;
  
  -- Insert each item
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into session_line_items (
      user_id,
      item_name,
      quantity,
      price,
      notes,
      table_number,
      status
    ) values (
      p_client_id,
      v_item->>'item_name',
      (v_item->>'quantity')::integer,
      (v_item->>'price')::numeric,
      v_item->>'notes',
      v_item->>'table_number',
      'pending'
    )
    returning id into v_inserted_id;
    
    v_inserted_ids := array_append(v_inserted_ids, v_inserted_id);
  end loop;
  
  return jsonb_build_object(
    'success', true,
    'message', 'Order placed successfully',
    'order_ids', v_inserted_ids
  );
exception
  when others then
    return jsonb_build_object(
      'success', false,
      'message', 'Failed to place order: ' || SQLERRM
    );
end;
$$;