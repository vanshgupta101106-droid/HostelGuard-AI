import { createSupabaseServer } from "@/lib/supabase/server"
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('=== DEBUG: Testing Supabase connection ===')
    
    const supabase = await createSupabaseServer()
    
    // Test 1: Basic connection
    console.log('Test 1: Basic connection test')
    const { data: connectionTest, error: connectionError } = await supabase.from('student').select('count').single()
    
    if (connectionError) {
      console.error('Connection error:', connectionError)
      return NextResponse.json({ 
        success: false, 
        error: 'Connection failed', 
        details: connectionError 
      })
    }
    
    console.log('Connection successful, count:', connectionTest)
    
    // Test 2: Simple student query
    console.log('Test 2: Simple student query')
    const { data: simpleStudents, error: simpleError } = await supabase
      .from('student')
      .select('student_id, full_name, roll_number')
      .limit(5)
    
    if (simpleError) {
      console.error('Simple query error:', simpleError)
      return NextResponse.json({ 
        success: false, 
        error: 'Simple query failed', 
        details: simpleError 
      })
    }
    
    console.log('Simple query successful, students:', simpleStudents?.length)
    
    // Test 3: Full query with joins
    console.log('Test 3: Full query with joins')
    const { data: fullStudents, error: fullError } = await supabase
      .from("student")
      .select(`
        *,
        room:room_id (
          room_number,
          floor:floor_id (
            floor_number,
            block (
              block_name,
              hostel:hostel_id (
                hostel_name
              )
            )
          )
        ),
        individual_risk_profile:student_id (
          risk_score,
          risk_level
        )
      `)
      .limit(5)
    
    if (fullError) {
      console.error('Full query error:', fullError)
      return NextResponse.json({ 
        success: false, 
        error: 'Full query failed', 
        details: fullError 
      })
    }
    
    console.log('Full query successful, students:', fullStudents?.length)
    
    return NextResponse.json({ 
      success: true, 
      message: 'All tests passed',
      data: {
        connectionTest,
        simpleStudents: simpleStudents?.length || 0,
        fullStudents: fullStudents?.length || 0,
        sampleStudent: fullStudents?.[0] || null
      }
    })
    
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Unexpected error', 
      details: error 
    })
  }
}
